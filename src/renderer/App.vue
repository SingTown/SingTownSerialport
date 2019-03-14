<template>
  <Row style="height: 100%;">
    <Col span="12" class="sendBox">
      <Card dis-hover style="margin: 10px">
        <Button slot="title" v-show="!connected" type="success" @click="connect">
          {{$t('connect')}}
        </Button>
        <Button slot="title" v-show="connected" type="error" @click="disconnect">
          {{$t('disconnect')}}
        </Button>
        <Button slot="title" type="text" @click.prevent="openURL('https://github.com/SingTown/SingTownSerialport')">{{$t('tutorial')}}</Button>
        <Select slot="title" v-model="lang" @on-change="changeLanguage" size="small" style="width:100px">
          <Option value="en">English</Option>
          <Option value="zh">简体中文</Option>
        </Select>
        <Form :label-width="60">
          <FormItem :label="$t('serialport')">
            <Select v-model="comName" v-bind:disabled="connected">
              <Option v-for="p in portList" :value="p.comName" :key="p.comName">{{ p.comName }}</Option>
            </Select>
          </FormItem>
          <FormItem :label="$t('baudrate')">
            <Select v-model="baudrate" v-bind:disabled="connected">
              <Option value="300">300</Option>
              <Option value="1200">1200</Option>
              <Option value="2400">2400</Option>
              <Option value="4800">4800</Option>
              <Option value="9600">9600</Option>
              <Option value="14400">14400</Option>
              <Option value="19200">19200</Option>
              <Option value="28800">28800</Option>
              <Option value="38400">38400</Option>
              <Option value="57600">57600</Option>
              <Option value="115200">115200</Option>
            </Select>
          </FormItem>
          <FormItem :label="$t('databit')" v-show="advancedSetting">
            <Select v-model="databit" v-bind:disabled="connected">
              <Option value="5">5</Option>
              <Option value="6">6</Option>
              <Option value="7">7</Option>
              <Option value="8">8</Option>
            </Select>
          </FormItem>
          <FormItem :label="$t('paritybit')" v-show="advancedSetting">
            <Select v-model="paritybit" v-bind:disabled="connected">
              <Option value="none">{{$t('none')}}</Option>
              <Option value="odd">{{$t('odd')}}</Option>
              <Option value="even">{{$t('even')}}</Option>
              <Option value="mark">{{$t('mark')}}</Option>
              <Option value="space">{{$t('space')}}</Option>
            </Select>
          </FormItem>
          <FormItem :label="$t('stopbit')" v-show="advancedSetting">
            <Select v-model="stopbit" v-bind:disabled="connected">
              <Option value="1">1</Option>
              <Option value="2">2</Option>
            </Select>
          </FormItem>
        </Form>
        <Icon v-if="!advancedSetting" type="ios-arrow-down" style="cursor: pointer; position:relative; left:50%;" @click.prevent="advancedSetting=!advancedSetting" />
        <Icon v-if="advancedSetting" type="ios-arrow-up" style="cursor: pointer; position:relative; left:50%;" @click.prevent="advancedSetting=!advancedSetting" />
      </Card>

      <Card dis-hover style="margin: 10px; flex-grow: 2; overflow:scroll;">
        {{$t('preview')}} binary
        <Icon type="md-eye" />
        {{previewBinary}}
      </Card>
      <Card dis-hover style="margin: 10px; flex-grow: 2; overflow:scroll;">
        {{$t('preview')}} hex
        <Icon type="md-eye" />
        {{previewHex}}
      </Card>
      <Card dis-hover style="margin: 10px; flex-grow: 2; overflow:scroll;">
        {{$t('preview')}} utf8
        <Icon type="md-eye" />
        {{previewString}}
      </Card>
      <Card dis-hover style="margin: 10px; bottom: 0px;">
        <RadioGroup v-model="sendEncode">
          <!-- <Radio label="binary"></Radio> -->
          <Radio label="hex"></Radio>
          <!-- <Radio label="ascii"></Radio> -->
          <Radio label="utf8"></Radio>
        </RadioGroup>
        <Checkbox v-if="sendEncode === 'utf8'" v-model="enableEscapeChar">{{$t('enable_escape_char')}}</Checkbox>
        <Input v-model="inputText" type="text" :placeholder="sendExample" />
        <Button type="success" long @click="write" :disabled="!connected || sendDataErr || !inputText"> {{$t('send')}} {{sendDataErr}}</Button>
      </Card>
    </Col>
    <Col span="12" class="sendBox">
      <Card id="rxArea" dis-hover style="margin: 10px; flex-grow: 2;overflow-y: scroll;">
        <Tabs type="card" value="utf8">
          <TabPane label="binary" name="binary">
            <p v-if="binaryRxData.length" style="white-space:break-all;">
              {{binaryRxData}}
            </p>
          </TabPane>
          <TabPane label="hex" name="hex">
            <p v-if="hexRxData.length" style="white-space:break-all;">
              {{hexRxData}}
            </p>
          </TabPane>
          <TabPane label="ascii" name="ascii">
            <div v-if="asciiRxData.length" style="overflow-x: scroll;">
              <pre>{{asciiRxData}}</pre>
            </div>
          </TabPane>
          <TabPane label="utf8" name="utf8">
            <div v-if="utf8RxData.length" style="overflow-x: scroll;">
              <pre>{{utf8RxData}}</pre>
            </div>
          </TabPane>
          <a href="#" @click.prevent="clear" slot="extra">{{$t('clear')}}</a>
        </Tabs>
      </Card>
      <Card dis-hover style="margin: 10px;">
        <div slot="title" style="cursor: pointer" @click.prevent="enableChart=!enableChart">{{$t('chart')}}📈</div>
        <Icon slot="extra" v-if="!enableChart" type="ios-arrow-up" style="cursor: pointer" @click.prevent="enableChart=!enableChart" />
        <Icon slot="extra" v-if="enableChart" type="ios-arrow-down" style="cursor: pointer" @click.prevent="enableChart=!enableChart" />
        <ve-line v-if="enableChart" :data = "chartData" height='300px' :legend-visible="false" :extend="{xAxis:{show:false}}"></ve-line>
      </Card>
    </Col>
  </Row>
</template>

<script>
  const SerialPort = require('serialport')
  const ByteLength = require('@serialport/parser-byte-length')
  const Readline = require('@serialport/parser-readline')
  const iconv = require('iconv-lite')
  const shell = require('electron').shell
  export default {
    name: 'SingTownSerialport',
    data () {
      return {
        lang: this.$i18n.locale,
        connected: false,
        port: null,
        portList: [],
        comName: '',
        baudrate: '9600',
        startbit: 0,
        databit: '8',
        paritybit: 'none',
        stopbit: '1',
        advancedSetting: false,
        sendEncode: 'utf8',
        rxDecode: 'utf8',
        inputText: '',
        enableEscapeChar: true,
        enableChart: false,
        binaryRxData: '',
        hexRxData: '',
        asciiRxData: '',
        utf8RxData: '',
        chartData: {
          columns: ['time', 'x'],
          rows: [{'time': 0, 'x': 0}]
        }
      }
    },
    created: function () {
      setInterval(this.scan, 1000)
      this.asciiStream = iconv.decodeStream('ascii')
      this.asciiStream.on('data', (str) => {
        this.asciiRxData += str
        if (this.asciiRxData.length > 10000) {
          this.asciiRxData = this.asciiRxData.substr(str.length)
        }
      })
      this.utf8Stream = iconv.decodeStream('utf8')
      this.utf8Stream.on('data', (str) => {
        this.utf8RxData += str
        if (this.utf8RxData.length > 10000) {
          this.utf8RxData = this.utf8RxData.substr(str.length)
        }
      })
      this.hexStream = new ByteLength({length: 1})
      this.hexStream.on('data', (data) => {
        let hexString = '00' + data[0].toString(16).toUpperCase()
        this.hexRxData += (' ' + hexString.slice(-2))
        let binaryString = '00000000' + data[0].toString(2)
        this.binaryRxData += (' ' + binaryString.slice(-8))
      })
      this.charStream = new Readline()
      this.charStream.on('data', (str) => {
        if (str) {
          let t = (new Date()).valueOf() - this.startDate
          // let x = num
          this.chartData.rows.push({'time': t.toString(), 'x': str.trim()})
          if (this.chartData.rows.length > 1000) {
            this.chartData.rows.shift()
          }
        }
      })
    },
    computed: {
      previewString: function () {
        return iconv.decode(Buffer.from(this.sendData), 'utf8')
      },
      previewBinary: function () {
        let binaryString = ''
        let s = ''
        for (let j = 0; j < this.sendData.length; j++) {
          s = '00000000' + this.sendData[j].toString(2)
          binaryString += (' ' + s.slice(-8))
        }
        return binaryString
      },
      previewHex: function () {
        let hexString = ''
        let s = ''
        for (let j = 0; j < this.sendData.length; j++) {
          s = '00' + this.sendData[j].toString(16).toUpperCase()
          hexString += (' ' + s.slice(-2))
        }
        return hexString
      },
      sendDataErr: function () {
        if (this.sendEncode === 'hex') {
          if (!(new RegExp('^[A-Fa-f0-9]*$')).test(this.inputText.replace(/\s+/g, ''))) {
            return this.$t('hex_input_limit_error')
          }
          if (this.inputText.replace(/\s+/g, '').length % 2 !== 0) {
            return this.$t('hex_input_length_error')
          }
          return null
        }
      },
      sendData: function () {
        const raw = this.inputText
        let str = raw
        if (this.sendEncode === 'utf8' && this.enableEscapeChar) {
          str = raw.replace(/\\\\/g, '\\').replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\b/g, '\b').replace(/\\f/g, '\f')
        } else if (this.sendEncode === 'hex') {
          str = raw.replace(/\s+/g, '')
        }
        return iconv.encode(str, this.sendEncode)
      },
      sendExample: function () {
        if (this.sendEncode === 'binary') {
          return '00001111'
        } else if (this.sendEncode === 'hex') {
          return 'FA FB 00 FF'
        } else if (this.sendEncode === 'utf8') {
          return '星瞳科技'
        } else {
          return 'www.singtown.com'
        }
      }
    },
    watch: {
      hexRxData: function () {
        var container = this.$el.querySelector('#rxArea')
        if (container.scrollHeight - container.clientHeight - container.scrollTop < 100) {
          container.scrollTop = container.scrollHeight
        }
      }
    },
    methods: {
      changeLanguage: function () {
        this.$i18n.locale = this.lang
        localStorage.setItem('language', this.lang)
      },
      scan: function () {
        SerialPort.list((err, ports) => {
          if (err) {
            this.$Notice.error({
              title: this.$t('serial_port_scan_error'),
              desc: err.message
            })
          } else {
            this.portList = ports
          }
        })
      },
      clear: function () {
        this.rxArray = []
        this.date = new Date()
        this.startDate = this.date.getTime()
        this.binaryRxData = []
        this.hexRxData = []
        this.asciiRxData = []
        this.utf8RxData = []
        this.chartData.rows = []
      },
      connect: function () {
        if (!this.comName) {
          this.$Notice.error({
            title: this.$t('no_serial_port_selected')
          })
          return
        }
        this.port = new SerialPort(this.comName, {
          baudRate: parseInt(this.baudrate),
          dataBits: parseInt(this.databit),
          parity: this.paritybit,
          stopBits: parseInt(this.stopbit)
        })
        this.port.on('open', () => {
          this.$Message.success(this.$t('serial_port_is_open'))
          this.connected = true
          this.clear()
        })
        this.port.on('error', (err) => {
          this.$Notice.error({
            title: this.$t('serial_port_failed_to_open'),
            desc: err.message
          })
          this.clear()
        })
        this.port.on('close', () => {
          this.$Message.warning(this.$t('serial_port_is_closed'))
          this.connected = false
        })
        this.port.pipe(this.hexStream)
        this.port.pipe(this.asciiStream)
        this.port.pipe(this.utf8Stream)
        this.port.pipe(this.charStream)
      },
      disconnect: function () {
        this.port.close()
      },
      write: function () {
        const data = this.sendData
        this.port.write(data)
      },
      openURL: function (url) {
        shell.openExternal(url)
      }
    }
  }
</script>
<style scoped>
.sendBox {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  flex-direction: column;
}
</style>


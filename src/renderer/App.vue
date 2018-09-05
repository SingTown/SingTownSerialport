<template>
  <Row style="height: 100%;">
    <Col span="12" class="sendBox">
      <Card dis-hover style="margin: 10px">
        <div slot="title" >串口设置</div>
        <Form :label-width="50">
          <FormItem label="串口">
            <Select v-model="comName" v-bind:disabled="connected">
              <Option v-for="p in portList" :value="p.comName" :key="p.comName">{{ p.comName }}</Option>
            </Select>
          </FormItem>
          <FormItem label="波特率">
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
          <FormItem label="数据位">
            <Select v-model="databit" v-bind:disabled="connected">
              <Option value="5">5</Option>
              <Option value="6">6</Option>
              <Option value="7">7</Option>
              <Option value="8">8</Option>
            </Select>
          </FormItem>
          <FormItem label="校验位">
            <Select v-model="paritybit" v-bind:disabled="connected">
              <Option value="N">无</Option>
              <Option value="O">奇</Option>
              <Option value="E">偶</Option>
              <Option value="H">高</Option>
              <Option value="L">低</Option>
            </Select>
          </FormItem>
          <FormItem label="停止位">
            <Select v-model="stopbit" v-bind:disabled="connected">
              <Option value="1">1</Option>
              <Option value="2">2</Option>
            </Select>
          </FormItem>
          <FormItem>
            <Button v-if="!connected" type="success" @click="connect">
              连接
            </Button>
            <Button v-else type="error" @click="disconnect">
              断开
            </Button>
            <Button to="https://singtown.com/learn/49844/" target="_blank" type="text">教程</Button>
          </FormItem>
        </Form>
      </Card>
      <Card dis-hover style="margin: 10px; flex-grow: 2; overflow:scroll;">
        <RadioGroup v-model="prDecode">
          <Radio label="binary"></Radio>
          <Radio label="hex"></Radio>
          <Radio label="string"></Radio>
        </RadioGroup>
        <div v-if="sendData">
          <div v-if="prDecode === 'binary'">
            <span v-for="rx in previewData">
              {{rx}}
            </span>
          </div>
          <div v-else-if="prDecode === 'hex'">
            <span v-for="rx in previewData">
              {{rx}}
            </span>
          </div>
          <div v-else>
            <pre>{{previewData}}</pre>
          </div>
        </div>
      </Card>

      <Card dis-hover style="margin: 10px; bottom: 0px;">
        <RadioGroup v-model="sendEncode">
          <Radio label="binary"></Radio>
          <Radio label="hex"></Radio>
          <Radio label="ascii"></Radio>
          <Radio label="utf8"></Radio>
        </RadioGroup>
        <Checkbox v-model="enableEscapeChar">开启转义字符</Checkbox>
        <Input v-model="inputText" type="text" :placeholder="sendExample" />
        <Alert v-if="!sendData && inputText" type="error">格式输入错误</Alert>
        <Button type="success" long @click="write" :disabled="!connected || !sendData || !inputText"> 发送</Button>
      </Card>
    </Col>
    <Col span="12" class="sendBox">
      <Card dis-hover style="margin: 10px; flex-grow: 2; overflow:scroll;">
        <div slot="title">接收历史</div>
        <a href="#" slot="extra" @click.prevent="enableChart=!enableChart">
          <Icon type="ios-loop-strong"></Icon>
          图表📈
        </a>
        <RadioGroup v-model="rxDecode">
          <Radio label="binary"></Radio>
          <Radio label="hex"></Radio>
          <Radio label="ascii"></Radio>
          <Radio label="utf8"></Radio>
        </RadioGroup>
        <div v-if="rxDecode === 'binary'">
          <span v-for="rx in binarryRxData">
            {{rx}}
          </span>
        </div>
        <div v-else-if="rxDecode === 'hex'">
          <span v-for="rx in hexRxData">
            {{rx}}
          </span>
        </div>
        <div v-else-if="rxDecode === 'ascii'">
          <pre>{{asciiRxData}}</pre>
        </div>
        <div v-else-if="rxDecode === 'utf8'">
          <pre>{{utf8RxData}}</pre>
        </div>
      </Card>
      <Card dis-hover v-show="enableChart" style="margin: 10px;">
        <ve-line :data = "chartData" height='300px' :legend-visible="false"></ve-line>
      </Card>
    </Col>
  </Row>
</template>

<script>
  const SerialPort = require('serialport')
  const ByteLength = require('@serialport/parser-byte-length')
  const Readline = require('@serialport/parser-readline')
  const iconv = require('iconv-lite')
  export default {
    name: 'SingTownSerialport',
    data () {
      return {
        connected: false,
        port: null,
        portList: [],
        comName: '',
        baudrate: '9600',
        startbit: 0,
        databit: '8',
        paritybit: 'N',
        stopbit: '1',
        sendEncode: 'ascii',
        prDecode: 'binary',
        rxDecode: 'utf8',
        inputText: '',
        enableEscapeChar: true,
        txNewline: '\\r\\n',
        rxNewline: '\\r\\n',
        enableChart: true,
        txArray: [],
        rxArray: [],
        binarryRxData: [],
        hexRxData: [],
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
      })

      this.utf8Stream = iconv.decodeStream('utf8')
      this.utf8Stream.on('data', (str) => {
        this.utf8RxData += str
      })

      this.binaryStream = new ByteLength({length: 1})
      this.binaryStream.on('data', (data) => {
        let d = data[0].toString(2)
        let bit8 = d
        for (let i = 0; i < 8 - d.length; i++) {
          bit8 = '0' + bit8
        }
        this.binarryRxData.push(bit8)
      })
      this.hexStream = new ByteLength({length: 1})
      this.hexStream.on('data', (data) => {
        let d = data[0].toString(16)
        let bit8 = d
        for (let i = 0; i < 2 - d.length; i++) {
          bit8 = '0' + bit8
        }
        this.hexRxData.push(bit8)
      })
      this.charStream = new Readline({ delimiter: '\r\n' })
      this.charStream.on('data', (str) => {
        let num = parseInt(str)
        if (num) {
          let t = (new Date()).valueOf() - this.startDate
          let x = num
          this.chartData.rows.push({'time': t.toString(), 'x': x})
        }
      })
    },
    computed: {
      previewData: function () {
        let data = this.sendData
        if (this.prDecode === 'binary') {
          let array = []
          for (let j = 0; j < data.length; j++) {
            let d = data[j].toString(2)
            let bit8 = d
            for (let i = 0; i < 8 - d.length; i++) {
              bit8 = '0' + bit8
            }
            array.push(bit8)
          }
          return array
        } else if (this.prDecode === 'hex') {
          let array = []
          for (let j = 0; j < data.length; j++) {
            let d = data[j].toString(16)
            let bit8 = d
            for (let i = 0; i < 2 - d.length; i++) {
              bit8 = '0' + bit8
            }
            array.push(bit8)
          }
          return array
        } else {
          let str = ''
          for (let j = 0; j < data.length; j++) {
            str += String.fromCharCode(data[j])
          }
          return str
        }
      },
      sendData: function () {
        const raw = this.inputText
        if (!raw) {
          return null
        }
        if (this.sendEncode === 'binary') {
          if ((new RegExp('^[0-1]*$')).test(raw)) {
            return ([parseInt(raw, 2)])
          } else {
            return null
          }
        } else if (this.sendEncode === 'hex') {
          if ((new RegExp('^[A-Fa-f0-9]*$')).test(raw)) {
            return ([parseInt(raw, 16)])
          } else {
            return null
          }
        }
        let array = []
        let str = raw
        if (this.enableEscapeChar) {
          str = raw.replace(/\\\\/g, '\\').replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\b/g, '\b').replace(/\\f/g, '\f')
        }
        for (let i = 0; i < str.length; i++) {
          let utf8 = iconv.encode(str[i], 'utf8')
          for (let j = 0; j < utf8.length; j++) {
            array.push(utf8[j])
          }
        }
        return array
      },
      sendExample: function () {
        if (this.sendEncode === 'binary') {
          return '00001111'
        } else if (this.sendEncode === 'hex') {
          return 'FAFB00FF'
        } else if (this.sendEncode === 'utf8') {
          return '星瞳科技'
        } else {
          return 'www.singtown.com'
        }
      }
    },
    methods: {
      scan: function () {
        SerialPort.list((err, ports) => {
          if (err) {
            this.$Notice.warning({
              title: '串口检测错误',
              desc: err.message
            })
          } else {
            this.portList = ports
          }
        })
      },
      connect: function () {
        if (!this.comName) {
          this.$Notice.error({
            title: '没有选择串口'
          })
          return
        }
        this.port = new SerialPort(this.comName)
        this.port.on('open', () => {
          this.$Notice.success({
            title: '串口已打开',
            desc: this.comName
          })
          this.connected = true
          this.rxArray = []
          this.date = new Date()
          this.startDate = this.date.getTime()
          this.binarryRxData = []
          this.hexRxData = []
          this.asciiRxData = []
          this.utf8RxData = []
          this.chartData.rows = []
        })
        this.port.on('error', (err) => {
          this.$Notice.error({
            title: '串口打开失败',
            desc: err.message
          })
        })
        this.port.on('close', () => {
          this.$Notice.success({
            title: '串口已关闭',
            desc: this.comName
          })
          this.connected = false
        })
        this.port.pipe(this.binaryStream)
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
      }
    }
  }
</script>
<style scoped>
.sendBox {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>


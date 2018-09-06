# SingTownSerialport

An easy to use serial port tool. Windows, Linux, MacOS.

中文项目介绍以及软件下载: https://singtown.com/learn/49844/

Software downloads: https://github.com/SingTown/SingTownSerialport/releases

![snapshot](https://github.com/singtown/singtownserialport/raw/master/static/singtown-serialport-snapshot.png)

**NOT** suppport Windows XP.

### Chart

If the software receives data in a specific format, you can display a line chart, just like the Arduino IDE.

Fromat: variable + '\r\n'

#### Arduino:
```Arduino
void setup() {
  Serial.begin(9600);
}
 
void loop() {
  Serial.println(1);
  delay(100)
}
```

#### MicroPython:
```python
from pyb import UART
uart = UART(3, 9600)
 
void loop() {
  uart.write(str(1)+'\r\n')
}
```

### Escape Char

Support Escape Char: \\, \t, \r, \n, \b, \f

### Build Setup

#### Environment

nodejs: https://nodejs.org/en/

for Windows:
```
npm install --global --production windows-build-tools
```

#### Build
``` bash
# git clone
git clone https://github.com/SingTown/SingTownSerialport.git

# install dependencies
npm install

# rebuild serialport module
npm run rebuild


npm run dev

# build electron application for production
npm run build

# run unit & end-to-end tests
npm test

# lint all JS/Vue component files in `src/`
npm run lint

```

# SingTownSerialport

An easy to use serial port tool. Windows, Linux, MacOS.

![snapshot](https://github.com/singtown/singtownserialport/raw/master/static/snapshot.png)

**NOT** suppport Windows XP.

- [x] Serial Port transfer
- [ ] i18n
  - [ ] English
  - [x] 中文
- [ ] Auto upgrade
- [x] Graph plotter like Arduino IDE
- [x] Escape Char \\, \t, \r, \n, \b, \f

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

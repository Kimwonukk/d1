import fs from "fs"
import path from "path"

const INPUT_PATH = "./tasks/datas/token.json"
const TOKEN_OUTPUT_PATH = "./src/styles/tokens/_tokens.scss"
const MIXINS_OUTPUT_PATH = "./src/styles/mixins/_mixins.scss"

const environment = process.env.NODE_ENV
console.log("환경:", environment)
const MIXINS_TYPE = ["typo"]
function distributionType(obj) {
  let tmpToken = {}
  let tmpMixin = {}
  for (var key in obj) {
    if (MIXINS_TYPE.includes(key)) {
      tmpMixin[key] = obj[key]
    } else {
      tmpToken[key] = obj[key]
    }
  }
  return { token: tmpToken, mixin: tmpMixin }
}
function makeCss(obj) {
  const { token, mixin } = distributionType(obj)

  const tokens = flattenTokens(token)
  const mixins = typoToMixin(mixin)
  return { tokens: tokens, mixins: mixins }
}
function changeVariantToVar(out) {
  let tmp = out
  let startIndex = tmp.indexOf("{")
  let endIndex = 0
  while (startIndex >= 0) {
    endIndex = tmp.indexOf("}", startIndex + 1)

    const variant = tmp.substring(startIndex + 1, endIndex)
    const changer = `var(--${variant.split(".").join("-")})`
    tmp = tmp.split(`{${variant}}`).join(changer)
    startIndex = tmp.indexOf("{", endIndex + 1)
  }

  return tmp
}
function flattenTokens(obj, prefix = []) {
  let result = {}

  for (const key in obj) {
    const value = obj[key]

    if (value && typeof value === "object" && "value" in value) {
      const cssVar = `--${[...prefix, key].join("-")}`
      result[cssVar] = value.value
    } else if (typeof value === "object") {
      Object.assign(result, flattenTokens(value, [...prefix, key]))
    }
  }

  return result
}
function typoToMixin(obj, prefix = []) {
  const MAP_TO_CSS = {
    fontSize: "font-size",
    fontWeight: "font-weight",
    lineHeight: "line-height",
  }
  const setValueToToken = (value) => {
    let temp = value.replace("{", "").replace("}", "")
    const tmpArr = temp.split(".")
    return `--${tmpArr.join("-")}`
  }
  const setKeyValue = (value) => {
    const temp = value
    let tempCss = ""
    if (typeof temp === "string") {
      tempCss += `  ${temp};\n`
    } else {
      for (const [key, value] of Object.entries(temp)) {
        const cssValue = value.includes("{") ? setValueToToken(value) : value
        tempCss += `  ${MAP_TO_CSS[key]}: ${cssValue};\n`
      }
    }
    return tempCss
  }
  let result = {}
  const mixins = flattenTokens(obj)
  for (const key in mixins) {
    result[key] = setKeyValue(mixins[key])
  }
  return result
}
const makeTokens = (flatTokens) => {
  let css = `:root {\n`

  for (const [key, value] of Object.entries(flatTokens)) {
    if (key.includes("--shadow")) {
      const shadows = Array.isArray(value) ? value : [value]
      css += `  ${key}: ${shadows
        .map((s) => {
          const arr = []
          for (const key in s) {
            const val = s[key]
            if (key === "type") {
              if (val === "innerShadow") {
                arr.unshift("inset")
              }
              continue
            }
            if (val.includes("{")) {
              let tmp = val.replace("{", "").replace("}", "")
              tmp = `--${tmp.split(".").join("-")}`
              tmp = `var(${tmp})`
              arr.push(tmp)
            } else {
              arr.push(val)
            }
          }
          return arr.join(" ")
        })
        .join(", ")};\n`
    } else {
      css += `  ${key}: ${changeVariantToVar(value)};\n`
    }
  }

  css += `}\n`

  fs.mkdirSync(path.dirname(TOKEN_OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(TOKEN_OUTPUT_PATH, css)
}
const typoMixinParsing = (key, value) => {
  let css = ""
  css += `@mixin ${key.replace("--", "")} {\n`
  let values = value.split(";")
  values = values.map((data) => {
    const datas = data.split(":")
    if (data.trim() === "") {
      return data
    }
    const dataKey = datas[0]
    const dataValue = datas[1]
    if (dataValue.includes("--")) {
      return `${dataKey}: var(${dataValue.trim()})`
    } else {
      return data
    }
  })
  css += `${values.join(";")}`
  css += `}\n`
  css += `.${key.replace("--", "")} {\n`
  css += `  @include ${key.replace("--", "")};\n`
  css += `}\n`
  return css
}
const gradientoMixinParsing = (key, value) => {
  let css = ""
  css += `@mixin ${key.replace("--", "")} {\n`
  css += `  background:${changeVariantToVar(value.trim() + "\n")}`
  css += `}\n`
  css += `.${key.replace("--", "")} {\n`
  css += `  @include ${key.replace("--", "")};\n`
  css += `}\n`
  return css
}
const makeMixs = (mixins) => {
  if (!mixins) return
  let css = ``
  for (const [key, value] of Object.entries(mixins)) {
    if (key.includes("--typo")) {
      css += typoMixinParsing(key, value)
    } else if (key.includes("--gradient")) {
      console.log("key", key, value)
      css += gradientoMixinParsing(key, value)
    }
    // console.log("key", value)
    // css += `@mixin ${key.replace("--", "")} {\n`
    // let values = value.split(";")
    // values = values.map((data) => {
    //   const datas = data.split(":")
    //   if (data.trim() === "") {
    //     return data
    //   }
    //   const dataKey = datas[0]
    //   const dataValue = datas[1]
    //   if (dataValue.includes("--")) {
    //     return `${dataKey}: var(${dataValue.trim()})`
    //   } else {
    //     return data
    //   }
    // })
    // css += `${values.join(";")}`
    // css += `}\n`
    // css += `.${key.replace("--", "")} {\n`
    // css += `  @include ${key.replace("--", "")};\n`
    // css += `}\n`
  }
  fs.mkdirSync(path.dirname(MIXINS_OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(MIXINS_OUTPUT_PATH, css)
}

function runTokenBuild() {
  const tokens = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"))
  const foundation = tokens?.global
  const cssObj = makeCss(foundation)
  makeTokens(cssObj.tokens)
  makeMixs(cssObj.mixins)
}

if (environment === "production") {
  runTokenBuild()
  console.log("✅ generated")
} else {
  runTokenBuild()
  // 특정 파일 또는 디렉토리 감시
  fs.watch("tasks/datas", { recursive: true }, (eventType, filename) => {
    if (filename) {
      console.log(`${filename} 파일이 변경되었습니다: ${eventType}`)
      // 여기서 변경 시 수행할 동작 (예: 빌드, 다시 불러오기 등)을 구현
      runTokenBuild()

      console.log("✅watch generated")
    }
  })
  console.log("감시 시작...")
}

import fs from "fs"
import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import chokidar from "chokidar"

const __dirname = path.resolve() // 현재 파일이 위치한 디렉터리
const INPUT_PATH = path.join(__dirname, "tasks", "datas", "token.json")
const TOKEN_OUTPUT_PATH = path.join(__dirname, "src", "styles", "tokens", "_tokens2.scss")
const MIXINS_OUTPUT_PATH = path.join(__dirname, "src", "styles", "mixins", "_mixins2.scss")
const environment = process.env.NODE_ENV

console.log("환경:", environment)
// 0. token과 mixin을 분리하여 처리
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
// 1. key를 kebab-case로 변환
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
}

// 2. value 포맷터 (type별 처리)
function formatValue(token) {
  const { value, type } = token

  // spacing / sizing / number → px
  if (typeof value === "number") {
    return `${value}px`
  }

  // boxShadow
  if (type === "boxShadow") {
    if (Array.isArray(value[0])) {
      return value.map((v) => `${v.x}px ${v.y}px ${v.blur}px ${v.spread}px ${v.color}`).join(", ")
    } else {
      let cssArr = []
      for (const [key, data] of Object.entries(value)) {
        const shadows = Array.isArray(data) ? data : [data]
        if (key === "type") {
          if (data === "innerShadow") {
            cssArr.unshift("inset")
          }
        } else {
          cssArr.push(data)
        }
      }
      return cssArr.join(" ")
    }
  }

  // typography (선택) - mixin으로 처리
  if (type === "typography" && typeof value === "object") {
    const tmp = []
    if (value.fontFamily) {
      tmp.push(`  font-family: ${value.fontFamily};`)
    }
    if (value.fontWeight) {
      tmp.push(`  font-weight: ${value.fontWeight};`)
    }
    if (value.fontSize) {
      tmp.push(`  font-size: ${value.fontSize};`)
    }
    if (value.lineHeight) {
      tmp.push(`  line-height: ${value.lineHeight};`)
    }
    if (value.letterSpacing) {
      tmp.push(`  letter-spacing: ${value.letterSpacing};`)
    }
    if (value.textDecoration) {
      tmp.push(`  text-decoration: ${value.textDecoration};`)
    }
    return tmp.join("\n")
  }

  // default
  return value
}

// 3. 토큰 재귀 순회
function walkTokens(obj, path = [], result = [], type = "") {
  for (const key in obj) {
    const token = obj[key]
    const newPath = [...path, toKebabCase(key)]

    if (token && typeof token === "object") {
      if ("value" in token) {
        const cssValue = formatValue(token)
        const key = newPath.join("-")

        // mixins 타입일 경우 css 함수로 변환
        if (type === "mixins") {
          let temp = ""
          temp += `@mixin ${key} {\n`
          temp += `${changeVariantToVar(cssValue)}\n`
          temp += `}\n`
          temp += `.${key.replace("--", "")} {\n`
          temp += `  @include ${key.replace("--", "")};\n`
          temp += `}\n`
          result.push(temp)
        }
        // 토큰 타입일 경우 css 변수로 변환
        else {
          result.push(`  --${key}: ${cssValue};`)
        }
      } else {
        // 토큰이 객체일 경우 재귀 순회
        walkTokens(token, newPath, result, type)
      }
    }
  }
  return result
}
// 4. css 내에 참조된 css 변수 파싱
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
  tmp = tmp.split("--global").join("-")
  return tmp
}

// 5. CSS 생성
function tokensToCSS(token) {
  const variables = walkTokens(token)
  return `:root {\n${changeVariantToVar(variables.join("\n"))}\n}`
}
function mixinsToCSS(mixin) {
  const variables = walkTokens(mixin, [], [], "mixins")

  return variables.join("\n")
}

// 5. export
// module.exports = tokensToCSS

async function init() {
  const tokens = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"))
  const { token, mixin } = distributionType(tokens.global)

  const cssToToken = tokensToCSS(token)
  const cssToMixin = mixinsToCSS(mixin)

  // const raw = await readFile(TOKEN_OUTPUT_PATH, "utf8")
  await mkdir(path.dirname(TOKEN_OUTPUT_PATH), { recursive: true })
  await writeFile(TOKEN_OUTPUT_PATH, cssToToken)

  // const raw2 = await readFile(MIXINS_OUTPUT_PATH, "utf8")
  await mkdir(path.dirname(MIXINS_OUTPUT_PATH), { recursive: true })
  await writeFile(MIXINS_OUTPUT_PATH, cssToMixin)
}

if (environment === "production") {
  init()
  console.log("✅ generated")
} else {
  init()
  // 특정 파일 또는 디렉토리 감시
  chokidar.watch("tasks/datas").on("all", (eventType, filename) => {
    if (filename) {
      console.log(`${filename} 파일이 변경되었습니다: ${eventType}`)
      init()
      console.log("✅watch generated")
    }
  })
  console.log("감시 시작...")
}

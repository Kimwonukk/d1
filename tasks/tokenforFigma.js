import fs from "fs"
import path from "path"

const INPUT_PATH = "./tasks/datas/token.json"
const OUTPUT_PATH = "./src/styles/tokens/_tokens.scss"

const environment = process.env.NODE_ENV
console.log("환경:", environment)
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
function runTokenBuild() {
  const tokens = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"))
  const foundation = tokens?.global
  const flatTokens = flattenTokens(foundation)

  let css = `:root {\n`

  for (const [key, value] of Object.entries(flatTokens)) {
    css += `  ${key}: ${value};\n`
  }

  css += `}\n`

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, css)
}
if (environment === "production") {
  runTokenBuild()
  console.log("✅ tokens.scss generated")
} else {
  runTokenBuild()
  // 특정 파일 또는 디렉토리 감시
  fs.watch("tasks/datas", { recursive: true }, (eventType, filename) => {
    if (filename) {
      console.log(`${filename} 파일이 변경되었습니다: ${eventType}`)
      // 여기서 변경 시 수행할 동작 (예: 빌드, 다시 불러오기 등)을 구현
      runTokenBuild()

      console.log("✅ tokens.scss watch generated")
    }
  })
  console.log("감시 시작...")
}

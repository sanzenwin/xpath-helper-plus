<script setup lang="ts">
import {sendMessageToContentScript} from "@/utils"
import {useLocalStorage, useClipboard} from "@vueuse/core"
import xPathToCss from "xpath-to-css"

const {isSupported, copy} = useClipboard()
const mode = ref<string>("xpath")
const windowUid = ref<string>("")
const xpathRule = ref<string>("")
const xpathShort = useLocalStorage<boolean>("xpathShort", true)
const xpathBatch = useLocalStorage<boolean>("xpathBatch", false)
const outputCss = useLocalStorage<boolean>("outputCss", true)
const xpathResult = ref<string>("");
const xpathResultCount = ref<number | null>(null);
const record = ref<string>("");

watch(xpathRule, value => {
  appendRecord(value)
  sendMessageToContentScript(
      {cmd: mode.value, value, css: outputCss.value, uid: windowUid.value},
      function (response: any) {
        xpathResult.value = response[0];
        xpathResultCount.value = response[1];
      });
}, {immediate: true});

function appendRecord(value: string) {
  if (!record.value.includes(value)) {
    if (record.value)
      record.value += '\n\n\n'
    record.value += value
  }
}

const handleShort = (v: boolean) => {
  xpathShort.value = v
  sendMessageToContentScript(
      {cmd: "short", value: xpathShort.value}
  )
}
const handleCss = (v: boolean) => {
  outputCss.value = v
  sendMessageToContentScript(
      {cmd: "css", value: outputCss.value}
  )
}
const handleBatch = (v: boolean) => {
  xpathBatch.value = v
  sendMessageToContentScript(
      {cmd: "batch", value: xpathBatch.value}
  )
}
const handlePosition = (v: string) => {
  sendMessageToContentScript(
      {cmd: "position"}
  )
}
handleShort(xpathShort.value)
const handleCopy = () => {
  copy(xpathRule.value)
}
const handleToCss = () => {
  let cssRule = xpathRule.value;
  if (!outputCss.value) {
    cssRule = xPathToCss(cssRule)
  }
  copy(cssRule)
}
const handleRecord = () => {
  copy(record.value)
}

// 接收来自content-script的消息
chrome?.runtime && chrome.runtime.onMessage.addListener(function (request: any, sender: any, sendResponse: any) {
  if (request.query) {
    console.log(request.query)
    windowUid.value = request.uid
    xpathRule.value = request.query
  }
});
</script>

<template>
  <div>
    <el-row :gutter="20" class="!m-0">
      <el-col :span="12">
        <el-row justify="space-between">
          <el-col :span="12" class="text-left h-5">
            <el-space wrap>
              <span class="text-size-2">XPATH</span>
              <el-checkbox v-model="xpathShort" @change="handleShort">精简xpath</el-checkbox>
              <el-checkbox v-model="xpathBatch" @change="handleBatch" :disabled="outputCss">列表模式</el-checkbox>
              <el-checkbox v-model="outputCss" @change="handleCss">输出Css</el-checkbox>
            </el-space>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-space wrap alignment="flex-start">
              <el-button type="primary" link @click="handleCopy" v-if="isSupported">xpath</el-button>
              <el-tooltip effect="light" content="将语句转为css选择器" placement="bottom">
                <el-button type="primary" link @click="handleToCss" v-if="isSupported">css</el-button>
              </el-tooltip>
              <el-button type="primary" link @click="handleRecord" v-if="isSupported">纪录</el-button>
              <el-button type="danger" link @click="record=''" v-if="isSupported">清除纪录</el-button>
            </el-space>
          </el-col>
        </el-row>
        <el-input type="textarea" spellcheck="false" style="font-size: 12pt" v-model="xpathRule" rows="4"/>
      </el-col>
      <el-col :span="12">
        <el-row justify="space-between">
          <el-col :span="12" class="text-left h-5">
            <el-space wrap>
              <span class="text-size-2">匹配结果</span>
              <span v-show="xpathResultCount">{{ xpathResultCount }}</span>
            </el-space>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button link @click="handlePosition">换个位置</el-button>
          </el-col>
        </el-row>
        <el-input type="textarea" v-model="xpathResult" rows="4" class="!resize-none"/>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
:deep(.el-textarea .el-textarea__inner) {
  resize: none;
}
</style>

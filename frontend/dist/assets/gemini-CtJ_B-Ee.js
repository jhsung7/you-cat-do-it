var j;(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(j||(j={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var K;(function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"})(K||(K={}));var B;(function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(B||(B={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const q=["user","model","function","system"];var Y;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(Y||(Y={}));var V;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(V||(V={}));var P;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(P||(P={}));var z;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(z||(z={}));var b;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.OTHER="OTHER"})(b||(b={}));var J;(function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"})(J||(J={}));var W;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(W||(W={}));var Q;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})(Q||(Q={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class g extends Error{constructor(t){super(`[GoogleGenerativeAI Error]: ${t}`)}}class A extends g{constructor(t,n){super(t),this.response=n}}class ie extends g{constructor(t,n,o,s){super(t),this.status=n,this.statusText=o,this.errorDetails=s}}class v extends g{}class re extends g{}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const he="https://generativelanguage.googleapis.com",fe="v1beta",me="0.24.1",pe="genai-js";var w;(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"})(w||(w={}));class ge{constructor(t,n,o,s,i){this.model=t,this.task=n,this.apiKey=o,this.stream=s,this.requestOptions=i}toString(){var t,n;const o=((t=this.requestOptions)===null||t===void 0?void 0:t.apiVersion)||fe;let i=`${((n=this.requestOptions)===null||n===void 0?void 0:n.baseUrl)||he}/${o}/${this.model}:${this.task}`;return this.stream&&(i+="?alt=sse"),i}}function ye(e){const t=[];return e!=null&&e.apiClient&&t.push(e.apiClient),t.push(`${pe}/${me}`),t.join(" ")}async function Ce(e){var t;const n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",ye(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let o=(t=e.requestOptions)===null||t===void 0?void 0:t.customHeaders;if(o){if(!(o instanceof Headers))try{o=new Headers(o)}catch(s){throw new v(`unable to convert customHeaders value ${JSON.stringify(o)} to Headers: ${s.message}`)}for(const[s,i]of o.entries()){if(s==="x-goog-api-key")throw new v(`Cannot set reserved header name ${s}`);if(s==="x-goog-api-client")throw new v(`Header name ${s} can only be set using the apiClient field`);n.append(s,i)}}return n}async function ve(e,t,n,o,s,i){const r=new ge(e,t,n,o,i);return{url:r.toString(),fetchOptions:Object.assign(Object.assign({},_e(i)),{method:"POST",headers:await Ce(r),body:s})}}async function S(e,t,n,o,s,i={},r=fetch){const{url:a,fetchOptions:c}=await ve(e,t,n,o,s,i);return Ee(a,c,r)}async function Ee(e,t,n=fetch){let o;try{o=await n(e,t)}catch(s){we(s,e)}return o.ok||await Ae(o,e),o}function we(e,t){let n=e;throw n.name==="AbortError"?(n=new re(`Request aborted when fetching ${t.toString()}: ${e.message}`),n.stack=e.stack):e instanceof ie||e instanceof v||(n=new g(`Error fetching from ${t.toString()}: ${e.message}`),n.stack=e.stack),n}async function Ae(e,t){let n="",o;try{const s=await e.json();n=s.error.message,s.error.details&&(n+=` ${JSON.stringify(s.error.details)}`,o=s.error.details)}catch{}throw new ie(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${n}`,e.status,e.statusText,o)}function _e(e){const t={};if((e==null?void 0:e.signal)!==void 0||(e==null?void 0:e.timeout)>=0){const n=new AbortController;(e==null?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),e!=null&&e.signal&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function L(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),M(e.candidates[0]))throw new A(`${C(e)}`,e);return Oe(e)}else if(e.promptFeedback)throw new A(`Text not available. ${C(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),M(e.candidates[0]))throw new A(`${C(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),X(e)[0]}else if(e.promptFeedback)throw new A(`Function call not available. ${C(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),M(e.candidates[0]))throw new A(`${C(e)}`,e);return X(e)}else if(e.promptFeedback)throw new A(`Function call not available. ${C(e)}`,e)},e}function Oe(e){var t,n,o,s;const i=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=e.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.text&&i.push(r.text),r.executableCode&&i.push("\n```"+r.executableCode.language+`
`+r.executableCode.code+"\n```\n"),r.codeExecutionResult&&i.push("\n```\n"+r.codeExecutionResult.output+"\n```\n");return i.length>0?i.join(""):""}function X(e){var t,n,o,s;const i=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=e.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.functionCall&&i.push(r.functionCall);if(i.length>0)return i}const be=[b.RECITATION,b.SAFETY,b.LANGUAGE];function M(e){return!!e.finishReason&&be.includes(e.finishReason)}function C(e){var t,n,o;let s="";if((!e.candidates||e.candidates.length===0)&&e.promptFeedback)s+="Response was blocked",!((t=e.promptFeedback)===null||t===void 0)&&t.blockReason&&(s+=` due to ${e.promptFeedback.blockReason}`),!((n=e.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(s+=`: ${e.promptFeedback.blockReasonMessage}`);else if(!((o=e.candidates)===null||o===void 0)&&o[0]){const i=e.candidates[0];M(i)&&(s+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(s+=`: ${i.finishMessage}`))}return s}function I(e){return this instanceof I?(this.v=e,this):new I(e)}function Ie(e,t,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var o=n.apply(e,t||[]),s,i=[];return s={},r("next"),r("throw"),r("return"),s[Symbol.asyncIterator]=function(){return this},s;function r(h){o[h]&&(s[h]=function(d){return new Promise(function(f,p){i.push([h,d,f,p])>1||a(h,d)})})}function a(h,d){try{c(o[h](d))}catch(f){u(i[0][3],f)}}function c(h){h.value instanceof I?Promise.resolve(h.value.v).then(m,E):u(i[0][2],h)}function m(h){a("next",h)}function E(h){a("throw",h)}function u(h,d){h(d),i.shift(),i.length&&a(i[0][0],i[0][1])}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Z=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function Re(e){const t=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=ke(t),[o,s]=n.tee();return{stream:Ne(o),response:Se(s)}}async function Se(e){const t=[],n=e.getReader();for(;;){const{done:o,value:s}=await n.read();if(o)return L(Te(t));t.push(s)}}function Ne(e){return Ie(this,arguments,function*(){const n=e.getReader();for(;;){const{value:o,done:s}=yield I(n.read());if(s)break;yield yield I(L(o))}})}function ke(e){const t=e.getReader();return new ReadableStream({start(o){let s="";return i();function i(){return t.read().then(({value:r,done:a})=>{if(a){if(s.trim()){o.error(new g("Failed to parse stream"));return}o.close();return}s+=r;let c=s.match(Z),m;for(;c;){try{m=JSON.parse(c[1])}catch{o.error(new g(`Error parsing JSON response: "${c[1]}"`));return}o.enqueue(m),s=s.substring(c[0].length),c=s.match(Z)}return i()}).catch(r=>{let a=r;throw a.stack=r.stack,a.name==="AbortError"?a=new re("Request aborted when reading from the stream"):a=new g("Error reading from the stream"),a})}}})}function Te(e){const t=e[e.length-1],n={promptFeedback:t==null?void 0:t.promptFeedback};for(const o of e){if(o.candidates){let s=0;for(const i of o.candidates)if(n.candidates||(n.candidates=[]),n.candidates[s]||(n.candidates[s]={index:s}),n.candidates[s].citationMetadata=i.citationMetadata,n.candidates[s].groundingMetadata=i.groundingMetadata,n.candidates[s].finishReason=i.finishReason,n.candidates[s].finishMessage=i.finishMessage,n.candidates[s].safetyRatings=i.safetyRatings,i.content&&i.content.parts){n.candidates[s].content||(n.candidates[s].content={role:i.content.role||"user",parts:[]});const r={};for(const a of i.content.parts)a.text&&(r.text=a.text),a.functionCall&&(r.functionCall=a.functionCall),a.executableCode&&(r.executableCode=a.executableCode),a.codeExecutionResult&&(r.codeExecutionResult=a.codeExecutionResult),Object.keys(r).length===0&&(r.text=""),n.candidates[s].content.parts.push(r)}s++}o.usageMetadata&&(n.usageMetadata=o.usageMetadata)}return n}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ae(e,t,n,o){const s=await S(t,w.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),o);return Re(s)}async function ce(e,t,n,o){const i=await(await S(t,w.GENERATE_CONTENT,e,!1,JSON.stringify(n),o)).json();return{response:L(i)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function le(e){if(e!=null){if(typeof e=="string")return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function R(e){let t=[];if(typeof e=="string")t=[{text:e}];else for(const n of e)typeof n=="string"?t.push({text:n}):t.push(n);return Me(t)}function Me(e){const t={role:"user",parts:[]},n={role:"function",parts:[]};let o=!1,s=!1;for(const i of e)"functionResponse"in i?(n.parts.push(i),s=!0):(t.parts.push(i),o=!0);if(o&&s)throw new g("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!o&&!s)throw new g("No content is provided for sending chat message.");return o?t:n}function $e(e,t){var n;let o={model:t==null?void 0:t.model,generationConfig:t==null?void 0:t.generationConfig,safetySettings:t==null?void 0:t.safetySettings,tools:t==null?void 0:t.tools,toolConfig:t==null?void 0:t.toolConfig,systemInstruction:t==null?void 0:t.systemInstruction,cachedContent:(n=t==null?void 0:t.cachedContent)===null||n===void 0?void 0:n.name,contents:[]};const s=e.generateContentRequest!=null;if(e.contents){if(s)throw new v("CountTokensRequest must have one of contents or generateContentRequest, not both.");o.contents=e.contents}else if(s)o=Object.assign(Object.assign({},o),e.generateContentRequest);else{const i=R(e);o.contents=[i]}return{generateContentRequest:o}}function ee(e){let t;return e.contents?t=e:t={contents:[R(e)]},e.systemInstruction&&(t.systemInstruction=le(e.systemInstruction)),t}function De(e){return typeof e=="string"||Array.isArray(e)?{content:R(e)}:e}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const te=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],Fe={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function Le(e){let t=!1;for(const n of e){const{role:o,parts:s}=n;if(!t&&o!=="user")throw new g(`First content should be with role 'user', got ${o}`);if(!q.includes(o))throw new g(`Each item should include role field. Got ${o} but valid roles are: ${JSON.stringify(q)}`);if(!Array.isArray(s))throw new g("Content should have 'parts' property with an array of Parts");if(s.length===0)throw new g("Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const a of s)for(const c of te)c in a&&(i[c]+=1);const r=Fe[o];for(const a of te)if(!r.includes(a)&&i[a]>0)throw new g(`Content with role '${o}' can't contain '${a}' part`);t=!0}}function ne(e){var t;if(e.candidates===void 0||e.candidates.length===0)return!1;const n=(t=e.candidates[0])===null||t===void 0?void 0:t.content;if(n===void 0||n.parts===void 0||n.parts.length===0)return!1;for(const o of n.parts)if(o===void 0||Object.keys(o).length===0||o.text!==void 0&&o.text==="")return!1;return!0}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const oe="SILENT_ERROR";class Ge{constructor(t,n,o,s={}){this.model=n,this.params=o,this._requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=t,o!=null&&o.history&&(Le(o.history),this._history=o.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(t,n={}){var o,s,i,r,a,c;await this._sendPromise;const m=R(t),E={safetySettings:(o=this.params)===null||o===void 0?void 0:o.safetySettings,generationConfig:(s=this.params)===null||s===void 0?void 0:s.generationConfig,tools:(i=this.params)===null||i===void 0?void 0:i.tools,toolConfig:(r=this.params)===null||r===void 0?void 0:r.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,cachedContent:(c=this.params)===null||c===void 0?void 0:c.cachedContent,contents:[...this._history,m]},u=Object.assign(Object.assign({},this._requestOptions),n);let h;return this._sendPromise=this._sendPromise.then(()=>ce(this._apiKey,this.model,E,u)).then(d=>{var f;if(ne(d.response)){this._history.push(m);const p=Object.assign({parts:[],role:"model"},(f=d.response.candidates)===null||f===void 0?void 0:f[0].content);this._history.push(p)}else{const p=C(d.response);p&&console.warn(`sendMessage() was unsuccessful. ${p}. Inspect response object for details.`)}h=d}).catch(d=>{throw this._sendPromise=Promise.resolve(),d}),await this._sendPromise,h}async sendMessageStream(t,n={}){var o,s,i,r,a,c;await this._sendPromise;const m=R(t),E={safetySettings:(o=this.params)===null||o===void 0?void 0:o.safetySettings,generationConfig:(s=this.params)===null||s===void 0?void 0:s.generationConfig,tools:(i=this.params)===null||i===void 0?void 0:i.tools,toolConfig:(r=this.params)===null||r===void 0?void 0:r.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,cachedContent:(c=this.params)===null||c===void 0?void 0:c.cachedContent,contents:[...this._history,m]},u=Object.assign(Object.assign({},this._requestOptions),n),h=ae(this._apiKey,this.model,E,u);return this._sendPromise=this._sendPromise.then(()=>h).catch(d=>{throw new Error(oe)}).then(d=>d.response).then(d=>{if(ne(d)){this._history.push(m);const f=Object.assign({},d.candidates[0].content);f.role||(f.role="model"),this._history.push(f)}else{const f=C(d);f&&console.warn(`sendMessageStream() was unsuccessful. ${f}. Inspect response object for details.`)}}).catch(d=>{d.message!==oe&&console.error(d)}),h}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function xe(e,t,n,o){return(await S(t,w.COUNT_TOKENS,e,!1,JSON.stringify(n),o)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ue(e,t,n,o){return(await S(t,w.EMBED_CONTENT,e,!1,JSON.stringify(n),o)).json()}async function He(e,t,n,o){const s=n.requests.map(r=>Object.assign(Object.assign({},r),{model:t}));return(await S(t,w.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:s}),o)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class se{constructor(t,n,o={}){this.apiKey=t,this._requestOptions=o,n.model.includes("/")?this.model=n.model:this.model=`models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=le(n.systemInstruction),this.cachedContent=n.cachedContent}async generateContent(t,n={}){var o;const s=ee(t),i=Object.assign(Object.assign({},this._requestOptions),n);return ce(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(o=this.cachedContent)===null||o===void 0?void 0:o.name},s),i)}async generateContentStream(t,n={}){var o;const s=ee(t),i=Object.assign(Object.assign({},this._requestOptions),n);return ae(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(o=this.cachedContent)===null||o===void 0?void 0:o.name},s),i)}startChat(t){var n;return new Ge(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(n=this.cachedContent)===null||n===void 0?void 0:n.name},t),this._requestOptions)}async countTokens(t,n={}){const o=$e(t,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),s=Object.assign(Object.assign({},this._requestOptions),n);return xe(this.apiKey,this.model,o,s)}async embedContent(t,n={}){const o=De(t),s=Object.assign(Object.assign({},this._requestOptions),n);return Ue(this.apiKey,this.model,o,s)}async batchEmbedContents(t,n={}){const o=Object.assign(Object.assign({},this._requestOptions),n);return He(this.apiKey,this.model,t,o)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class de{constructor(t){this.apiKey=t}getGenerativeModel(t,n){if(!t.model)throw new g("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new se(this.apiKey,t,n)}getGenerativeModelFromCachedContent(t,n,o){if(!t.name)throw new v("Cached content must contain a `name` field.");if(!t.model)throw new v("Cached content must contain a `model` field.");const s=["model","systemInstruction"];for(const r of s)if(n!=null&&n[r]&&t[r]&&(n==null?void 0:n[r])!==t[r]){if(r==="model"){const a=n.model.startsWith("models/")?n.model.replace("models/",""):n.model,c=t.model.startsWith("models/")?t.model.replace("models/",""):t.model;if(a===c)continue}throw new v(`Different value for "${r}" specified in modelParams (${n[r]}) and cachedContent (${t[r]})`)}const i=Object.assign(Object.assign({},n),{model:t.model,tools:t.tools,toolConfig:t.toolConfig,systemInstruction:t.systemInstruction,cachedContent:t});return new se(this.apiKey,i,o)}}const ue=[{id:"vomiting",topic:"Cat Vomiting",keywords:["토","구토","게워","vomit","throw up","regurgitate"],content:{ko:"단발성 구토(24시간 내 1-2회)는 털뭉치나 급식으로 인해 정상적일 수 있습니다. 그러나 24시간 내 3회 이상, 혈액이나 담즙 동반, 무기력 동반 시 응급 상황입니다. 구토 후 12-24시간 금식하고 소량의 물만 제공하며 관찰하세요.",en:"Single episodes of vomiting (1-2 times per 24 hours) can be normal due to hairballs or eating too quickly. However, 3+ times in 24 hours, presence of blood or bile, or accompanied by lethargy requires emergency care. After vomiting, fast for 12-24 hours and provide only small amounts of water."},source:{ko:"WSAVA 소화기 질환 가이드라인, 2022",en:"WSAVA Gastrointestinal Disease Guidelines, 2022",url:"https://wsava.org/global-guidelines/"}},{id:"diarrhea",topic:"Diarrhea",keywords:["설사","diarrhea","loose stool","묽은"],content:{ko:"급성 설사는 식이 변화, 스트레스, 경미한 감염으로 발생할 수 있습니다. 24-48시간 지속되는 경증 설사는 집에서 관찰 가능하나, 혈변, 검은 변, 48시간 이상 지속, 탈수 증상(눈 움푹 들어감, 피부 탄력 저하) 동반 시 즉시 병원 방문이 필요합니다.",en:"Acute diarrhea can result from dietary changes, stress, or mild infections. Mild diarrhea lasting 24-48 hours can be monitored at home, but bloody stool, black stool, persistence beyond 48 hours, or dehydration signs (sunken eyes, poor skin elasticity) require immediate veterinary attention."},source:{ko:"고양이 소화기 건강 매뉴얼, AAHA, 2023",en:"Feline Digestive Health Manual, AAHA, 2023",url:"https://www.aaha.org"}},{id:"appetite-loss",topic:"Loss of Appetite",keywords:["식욕","안먹","밥","사료","appetite","eating","food","anorexia"],content:{ko:"고양이가 24시간 이상 식사를 거부하면 간 지방증(hepatic lipidosis) 위험이 있습니다. 특히 과체중 고양이에서 48시간 이상 금식 시 생명을 위협할 수 있습니다. 24시간 식욕 부진 시 병원 상담, 48시간 이상 시 즉시 응급 진료가 필요합니다.",en:"Cats refusing food for more than 24 hours risk hepatic lipidosis (fatty liver disease). This is especially dangerous in overweight cats, becoming life-threatening after 48+ hours of fasting. Consult a vet after 24 hours of appetite loss; emergency care is needed after 48+ hours."},source:{ko:"Cornell Feline Health Center 영양 가이드, 2023",en:"Cornell Feline Health Center Nutrition Guide, 2023",url:"https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center"}},{id:"urinary-issues",topic:"Urinary Problems",keywords:["소변","화장실","오줌","urine","urinary","litter","pee"],content:{ko:"배뇨 곤란, 소량 빈번한 배뇨, 혈뇨, 화장실에서 울부짖음은 요로폐색의 징후일 수 있으며, 특히 수컷 고양이에서 응급 상황입니다. 12시간 이상 배뇨하지 못하면 신부전으로 이어질 수 있어 즉시 응급실 방문이 필요합니다.",en:"Difficulty urinating, frequent small urinations, bloody urine, or crying in the litter box can indicate urinary obstruction, especially emergent in male cats. Inability to urinate for 12+ hours can lead to kidney failure and requires immediate emergency care."},source:{ko:"International Cat Care 요로 건강 가이드, 2023",en:"International Cat Care Urinary Health Guide, 2023",url:"https://icatcare.org"}},{id:"breathing-difficulty",topic:"Breathing Difficulty",keywords:["숨","호흡","헐떡","breathing","respiratory","panting","wheeze"],content:{ko:"고양이의 입벌림 호흡, 빠른 호흡(분당 40회 이상), 복부를 이용한 호흡은 심각한 호흡곤란의 징후입니다. 고양이는 개와 달리 헐떡이지 않으므로, 이런 증상은 즉시 응급 진료가 필요합니다. 천식, 심부전, 흉수 등 생명을 위협하는 상황일 수 있습니다.",en:"Open-mouth breathing, rapid breathing (>40 breaths/min), or abdominal breathing indicates severe respiratory distress. Unlike dogs, cats do not pant, so these signs require immediate emergency care. This can indicate life-threatening conditions like asthma, heart failure, or pleural effusion."},source:{ko:"RECOVER 고양이 응급 치료 지침, 2022",en:"RECOVER Feline Emergency Care Guidelines, 2022",url:"https://recoverinitiative.org"}},{id:"nutrition-basics",topic:"Feline Nutrition",keywords:["사료","영양","먹이","food","nutrition","diet","feed"],content:{ko:"고양이는 절대 육식동물로 타우린, 아라키돈산, 비타민A(프리포름) 등이 필수입니다. 성묘는 체중 kg당 40-60kcal가 필요하며, AAFCO 또는 FEDIAF 기준을 충족하는 사료를 선택해야 합니다. 로얄캐닌, 힐스, 퓨리나 프로플랜 등이 과학적으로 검증된 브랜드입니다.",en:"Cats are obligate carnivores requiring taurine, arachidonic acid, and preformed vitamin A. Adult cats need 40-60 kcal per kg body weight. Choose foods meeting AAFCO or FEDIAF standards. Royal Canin, Hills, and Purina Pro Plan are scientifically validated brands."},source:{ko:"AAFCO 고양이 영양 기준, 2023",en:"AAFCO Feline Nutrition Standards, 2023",url:"https://www.aafco.org"}},{id:"weight-monitoring",topic:"Weight Management",keywords:["체중","살","비만","weight","obesity","fat","overweight"],content:{ko:"이상적 체중에서 10-19% 초과 시 과체중, 20% 이상 시 비만으로 분류됩니다. 비만은 당뇨, 관절염, 간 질환 위험을 증가시킵니다. 체중 감량은 주당 1-2% 이하로 서서히 진행해야 하며, 급격한 감량은 간 지방증을 유발할 수 있습니다.",en:"Cats are considered overweight at 10-19% above ideal weight, obese at 20%+. Obesity increases risks of diabetes, arthritis, and liver disease. Weight loss should be gradual at 1-2% per week maximum; rapid loss can cause hepatic lipidosis."},source:{ko:"WSAVA 영양 평가 가이드라인, 2023",en:"WSAVA Nutrition Assessment Guidelines, 2023",url:"https://wsava.org/global-guidelines/"}},{id:"behavioral-changes",topic:"Behavioral Changes",keywords:["행동","무기력","공격","behavior","lethargy","aggressive","hiding"],content:{ko:"갑작스러운 행동 변화(숨기, 공격성 증가, 과도한 무기력)는 통증이나 질병의 신호일 수 있습니다. 고양이는 본능적으로 아픔을 숨기므로, 미묘한 행동 변화도 주의 깊게 관찰해야 합니다. 평소와 다른 모습이 2일 이상 지속되면 수의사 상담이 필요합니다.",en:"Sudden behavioral changes (hiding, increased aggression, excessive lethargy) can signal pain or illness. Cats instinctively hide pain, so subtle behavioral changes require careful attention. If unusual behavior persists for 2+ days, veterinary consultation is needed."},source:{ko:"AAFP 고양이 통증 관리 가이드라인, 2022",en:"AAFP Feline Pain Management Guidelines, 2022",url:"https://catvets.com/guidelines"}},{id:"hydration",topic:"Water Intake and Hydration",keywords:["물","수분","탈수","water","hydration","dehydration","drink"],content:{ko:"고양이는 체중 kg당 하루 40-60ml의 물이 필요합니다(4kg 고양이 = 160-240ml). 탈수 증상: 피부 탄력 저하, 눈 움푹 들어감, 끈적한 잇몸. 만성 탈수는 신장 질환으로 이어질 수 있습니다. 습식 사료 급여와 여러 곳에 물그릇 배치가 도움이 됩니다.",en:"Cats need 40-60ml of water per kg body weight daily (4kg cat = 160-240ml). Dehydration signs: poor skin elasticity, sunken eyes, sticky gums. Chronic dehydration can lead to kidney disease. Wet food feeding and multiple water bowl locations help."},source:{ko:"Cornell 수의과대학 고양이 건강 센터, 2023",en:"Cornell University College of Veterinary Medicine Feline Health Center, 2023",url:"https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center"}},{id:"dental-health",topic:"Dental Health",keywords:["치아","입","구강","dental","teeth","mouth","oral","bad breath"],content:{ko:"3세 이상 고양이의 80%가 치주 질환을 가지고 있습니다. 증상: 구취, 침흘림, 식욕 감소, 한쪽으로만 씹기. 예방: 매일 칫솔질(이상적), 치아 건강 간식, 정기 치과 검진. 치주 질환은 심장, 신장 문제로 이어질 수 있어 정기적인 관리가 중요합니다.",en:"80% of cats over 3 years have periodontal disease. Symptoms: bad breath, drooling, decreased appetite, chewing on one side. Prevention: daily brushing (ideal), dental treats, regular dental exams. Periodontal disease can lead to heart and kidney problems, making regular care essential."},source:{ko:"AVDC 고양이 치과 건강 지침, 2023",en:"AVDC Feline Dental Health Guidelines, 2023",url:"https://avdc.org"}}],je=(e,t="ko",n=2)=>{const o=e.toLowerCase();return ue.map(i=>{const r=i.keywords.filter(a=>o.includes(a.toLowerCase())).length;return{knowledge:i,score:r}}).filter(i=>i.score>0).sort((i,r)=>r.score-i.score).slice(0,n).map(i=>i.knowledge)},N="AIzaSyDCu3H7TArwm4Be3a0MoeznCO5vSYVsaVA",G=new de(N),D="gemini-2.5-flash",$=10,T=e=>(e==null?void 0:e.toLowerCase().replace(/[^a-z0-9가-힣]/g,""))||"",Ke=async(e,t)=>{if(e.length<=$)return null;try{const o=new de(N||"").getGenerativeModel({model:D}),s=e.slice(0,e.length-$),i=t==="ko"?`다음 대화를 핵심 내용만 3-4줄로 요약하세요. 고양이 건강 관련 중요 정보(증상, 처방된 조언, 언급된 질환)만 포함:

${s.map(a=>`${a.role==="user"?"사용자":"수의사"}: ${a.content}`).join(`
`)}`:`Summarize this conversation in 3-4 lines, focusing only on key health information (symptoms, advice given, conditions mentioned):

${s.map(a=>`${a.role==="user"?"User":"Vet"}: ${a.content}`).join(`
`)}`;return(await o.generateContent(i)).response.text().trim()}catch(n){return console.error("Failed to summarize conversation:",n),null}},Be=(e,t,n)=>{var c;const o=(e==null?void 0:e.name)||(n==="ko"?"고양이":"your cat"),s=t.length?t.map(m=>`• ${m.content[n]}`).join(`
`):n==="ko"?"증상이 지속되거나 악화되면 가까운 병원에 상담하세요.":"Monitor closely and seek veterinary care if the condition worsens.",i=n==="ko"?`${o}의 상태를 정확히 확인할 수 있는 AI 연결이 원활하지 않아 기본 가이드라인을 안내드립니다.
${s}`:`I could not reach the AI service, but here are evidence-based pointers for ${o}:
${s}`,r=n==="ko"?["증상이 언제 시작됐나요?","최근 식사와 물 섭취량은 어떤가요?","이와 관련된 다른 변화가 있었나요?"]:["When did the symptom begin?","How are eating and drinking today?","Any other changes noticed?"],a=t.length?"medium":"low";return{answer:i,reasoning:(c=t[0])==null?void 0:c.content[n],confidence:a,followUpQuestions:r,sources:t.map(m=>({type:m.topic,content:m.source[n],url:m.source.url}))}},F=(e,t,n)=>{const o=e.match(/(\d+)\s*(ml|g|번|times|x)?/i);if(o)return Number(o[1]);if(t==="ko"){if(e.includes("두"))return 2;if(e.includes("세"))return 3;if(e.includes("한"))return 1}else{if(e.includes("twice")||e.includes("two"))return 2;if(e.includes("three"))return 3;if(e.includes("once")||e.includes("one"))return 1}return n},qe=(e,t)=>{const n=e.toLowerCase(),o={success:!0,notes:e};(t==="ko"?["밥","사료","먹었"]:["ate","food","meal","feed"]).some(c=>n.includes(c))&&(o.foodAmount=F(n,t,50)),(t==="ko"?["물","마셨","수분"]:["drink","drank","water"]).some(c=>n.includes(c))&&(o.waterAmount=F(n,t,50)),(t==="ko"?["화장실","똥","응가"]:["litter","poop","bathroom"]).some(c=>n.includes(c))&&(o.litterCount=F(n,t,1));const a=t==="ko"?{구토:{type:"구토",severity:"moderate"},토했:{type:"구토",severity:"moderate"},설사:{type:"설사",severity:"moderate"},기침:{type:"기침",severity:"mild"},재채기:{type:"재채기",severity:"mild"},무기력:{type:"무기력",severity:"moderate"}}:{vomit:{type:"vomit",severity:"moderate"},"throw up":{type:"vomit",severity:"moderate"},diarrhea:{type:"diarrhea",severity:"moderate"},cough:{type:"cough",severity:"mild"},sneeze:{type:"sneeze",severity:"mild"},letharg:{type:"lethargy",severity:"moderate"}};for(const c in a)if(n.includes(c)){o.symptom={type:a[c].type,description:e,severity:a[c].severity},(c.includes("설사")||c.includes("diarrhea"))&&(o.litterCount=o.litterCount||1);break}return o},Ye=(e,t)=>{const n=e.toLowerCase(),o=["숨","breath","resp","경련","seiz","blood","혈","의식"],s=["구토","vomit","설사","diarrhea","무기력","letharg"];let i="mild";return o.some(c=>n.includes(c))?i="emergency":s.some(c=>n.includes(c))&&(i="warning"),{urgency:i,analysis:t==="ko"?i==="emergency"?"설명된 증상은 응급일 수 있습니다. 즉시 동물병원에 연락하세요.":i==="warning"?"증상이 주의가 필요합니다. 1-2일 관찰 후 악화 시 병원을 방문하세요.":"경미한 증상으로 보여 집에서 관찰하세요.":i==="emergency"?"These symptoms can be emergent. Contact an emergency vet immediately.":i==="warning"?"Monitor for 1-2 days and see a vet if symptoms worsen.":"Looks mild; keep monitoring at home.",recommendations:t==="ko"?["증상 기록을 유지하세요.","악화되면 병원에 연락하세요."]:["Keep a log of changes.","Contact a vet if things worsen."]}},Ve=async(e,t,n,o="ko",s,i=[])=>{const r=je(e,o,2);try{const a=G.getGenerativeModel({model:D}),c=s&&s.length>$?await Ke(s,o):null;let u=(o==="ko"?`당신은 경험 많은 고양이 전문 수의사입니다.

답변 방식:
1. **내부 추론 (reasoning)**: 먼저 증상을 분석하고 감별 진단을 고려합니다 (사용자에게는 보이지 않음)
   - 가능한 원인들 나열
   - 심각도 평가
   - 제공된 수의학 지식 참고
2. **답변 (answer)**: 간결한 결론 (3-4문장)
3. **확신도 (confidence)**: high(명확한 경우), medium(추가 정보 필요), low(불확실한 경우)

답변 지침:
- 핵심만 전달하고 불필요한 인사말이나 마무리 문구 생략
- 증상이 경미하면 "집에서 관찰 가능", 중간이면 "1-2일 관찰 후 악화시 병원", 심각하면 "즉시 병원 방문" 추천
- 일반적인 질문에는 병원 방문을 강요하지 말 것
- **중요**: 이전 대화 내용을 기억하고 반영하여 답변 (사용자가 언급한 사료, 증상 등)
- 답변의 근거가 되는 수의학 지식, 논문, 가이드라인이 있다면 반드시 출처를 명시

출력 형식 (JSON):
{
  "reasoning": "내부 사고 과정 - 가능한 원인, 감별 진단, 심각도 평가 (2-3문장)",
  "answer": "사용자에게 보여줄 간결한 답변 (3-4문장)",
  "confidence": "high|medium|low",
  "followUpQuestions": ["후속 질문 1", "후속 질문 2", "후속 질문 3"],
  "sources": [
    {"title": "출처 제목", "reference": "저자/기관명, 연도"}
  ]
}`:`You are an experienced veterinarian specializing in cats.

Response approach:
1. **Internal reasoning**: First analyze symptoms and consider differential diagnosis (not shown to user)
   - List possible causes
   - Assess severity
   - Reference provided veterinary knowledge
2. **Answer**: Concise conclusion (3-4 sentences)
3. **Confidence**: high (clear case), medium (needs more info), low (uncertain)

Guidelines:
- Focus on key points, skip pleasantries
- For mild symptoms: "monitor at home", moderate: "observe 1-2 days, visit vet if worsens", severe: "immediate vet visit"
- Don't always recommend vet visits for general questions
- **Important**: Remember and reference previous conversation context (foods, symptoms mentioned)
- Cite veterinary knowledge, research papers, or guidelines when applicable

Output format (JSON):
{
  "reasoning": "Internal thought process - possible causes, differential diagnosis, severity assessment (2-3 sentences)",
  "answer": "Concise answer for user (3-4 sentences)",
  "confidence": "high|medium|low",
  "followUpQuestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"],
  "sources": [
    {"title": "Source title", "reference": "Author/Organization, Year"}
  ]
}`)+(o==="ko"?`

📚 학습 예시:

예시 1:
사용자: "고양이가 사료를 평소보다 적게 먹어요"
응답:
{
  "reasoning": "일시적 식욕 감소는 스트레스, 날씨 변화, 사료 기호도 변화 등으로 흔히 발생. 24시간 미만이고 다른 증상 없으면 경미. 무기력, 구토 동반 시 주의 필요.",
  "answer": "일시적 식욕 감소는 흔합니다. 24시간 관찰하고 물은 충분히 제공하세요. 무기력하거나 구토가 동반되면 병원 방문이 필요합니다.",
  "confidence": "high",
  "followUpQuestions": ["다른 증상은 없나요?", "최근 사료를 바꾸셨나요?", "평소 몇 그램 정도 먹나요?"],
  "sources": [{"title": "고양이 식욕부진 진단 가이드", "reference": "AAHA, 2023"}]
}

예시 2:
사용자: "설사를 하는데 피가 섞여있어요"
응답:
{
  "reasoning": "혈변은 장 출혈의 징후로 감염성 장염, 기생충, IBD, 종양 등 다양한 원인 가능. 탈수 위험 높고 응급 상황. 즉시 수의사 진료 필요.",
  "answer": "혈변은 응급 상황입니다. 즉시 동물병원 방문이 필요합니다. 탈수 방지를 위해 물은 계속 제공하되 사료는 수의사 상담 전까지 급여를 중단하세요.",
  "confidence": "high",
  "followUpQuestions": [],
  "sources": [{"title": "급성 위장관 출혈 진단 가이드라인", "reference": "WSAVA, 2022"}]
}

예시 3:
사용자: "아까 로얄캐닌 추천해주셨는데, 다른 브랜드는 어때요?"
응답:
{
  "reasoning": "이전 대화에서 로얄캐닌 언급됨. 사용자는 다른 옵션 탐색 중. 힐스, 퓨리나 프로플랜도 AAFCO 기준 충족하는 과학적으로 검증된 브랜드.",
  "answer": "힐스나 퓨리나 프로플랜도 좋은 선택입니다. 로얄캐닌과 유사한 영양 기준을 충족하며, 고양이의 기호도에 따라 선택하시면 됩니다. 모두 AAFCO 인증 제품입니다.",
  "confidence": "high",
  "followUpQuestions": ["특정 건강 문제가 있나요?", "현재 사료에 알러지 반응은 없나요?", "나이가 어떻게 되나요?"],
  "sources": [{"title": "AAFCO 고양이 영양 기준", "reference": "AAFCO, 2023"}]
}
`:`

📚 Learning Examples:

Example 1:
User: "My cat is eating less than usual"
Response:
{
  "reasoning": "Temporary appetite decrease commonly occurs due to stress, weather changes, or food preference shifts. If under 24 hours with no other symptoms, likely mild. Requires attention if accompanied by lethargy or vomiting.",
  "answer": "Temporary appetite decrease is common. Monitor for 24 hours and ensure adequate water. If accompanied by lethargy or vomiting, veterinary visit is needed.",
  "confidence": "high",
  "followUpQuestions": ["Are there any other symptoms?", "Did you recently change food?", "How much does your cat usually eat?"],
  "sources": [{"title": "Feline Anorexia Diagnostic Guide", "reference": "AAHA, 2023"}]
}

Example 2:
User: "My cat has diarrhea with blood in it"
Response:
{
  "reasoning": "Bloody stool indicates intestinal bleeding from infectious enteritis, parasites, IBD, tumors, etc. High dehydration risk and emergency situation. Immediate veterinary care required.",
  "answer": "Bloody stool is an emergency. Immediate veterinary visit required. Continue providing water to prevent dehydration, but withhold food until veterinary consultation.",
  "confidence": "high",
  "followUpQuestions": [],
  "sources": [{"title": "Acute Gastrointestinal Bleeding Diagnostic Guidelines", "reference": "WSAVA, 2022"}]
}

Example 3:
User: "You recommended Royal Canin earlier, what about other brands?"
Response:
{
  "reasoning": "Previous conversation mentioned Royal Canin. User exploring alternatives. Hills and Purina Pro Plan also meet AAFCO standards and are scientifically validated brands.",
  "answer": "Hills or Purina Pro Plan are also excellent choices. They meet similar nutritional standards as Royal Canin and you can choose based on your cat's preference. All are AAFCO certified.",
  "confidence": "high",
  "followUpQuestions": ["Does your cat have any specific health issues?", "Any allergic reactions to current food?", "How old is your cat?"],
  "sources": [{"title": "AAFCO Feline Nutrition Standards", "reference": "AAFCO, 2023"}]
}
`)+`

`;if(r.length>0&&(u+=o==="ko"?`🔬 참고할 수의학 지식:
`:`🔬 Veterinary Knowledge Reference:
`,r.forEach(l=>{u+=`- ${l.content[o]}
  출처: ${l.source[o]}
`}),u+=`
`),t){let l=o==="ko"?`🐱 고양이 정보: ${t.name} (${t.breed}, ${t.weight}kg, 중성화: ${t.neutered?"O":"X"}`:`🐱 Cat Profile: ${t.name} (${t.breed}, ${t.weight}kg, Neutered: ${t.neutered?"Yes":"No"}`;t.chronicConditions&&t.chronicConditions.length>0&&(l+=o==="ko"?`, ⚠️ 만성질환: ${t.chronicConditions.join(", ")}`:`, ⚠️ Chronic Conditions: ${t.chronicConditions.join(", ")}`),u+=l+`)

`}s&&s.length>0&&(c&&(u+=o==="ko"?`📝 이전 대화 요약:
${c}

`:`📝 Previous Conversation Summary:
${c}

`),u+=o==="ko"?`💬 최근 대화:
`:`💬 Recent Conversation:
`,s.slice(-$).forEach(y=>{const O=y.role==="user"?o==="ko"?"사용자":"User":o==="ko"?"수의사":"Vet";u+=`${O}: ${y.content}
`}),u+=`
`),i.length>0&&(u+=o==="ko"?`🚨 최근 감지된 이상 징후:
`:`🚨 Recent anomalies detected:
`,i.forEach(l=>{u+=`- ${l.description}
`}),u+=`
`),n&&n.length>0&&(u+=o==="ko"?`최근 7일 건강 기록:
`:`Recent 7-day health records:
`,n.slice(0,7).forEach(l=>{const y=[];l.foodAmount&&y.push(`${o==="ko"?"사료":"Food"} ${l.foodAmount}g`),l.waterAmount&&y.push(`${o==="ko"?"물":"Water"} ${l.waterAmount}ml`),l.litterCount&&y.push(`${o==="ko"?"배변":"Litter"} ${l.litterCount}${o==="ko"?"회":"x"}`),l.activityLevel&&y.push(`${o==="ko"?"활동":"Activity"}: ${l.activityLevel}`),l.mood&&y.push(`${o==="ko"?"기분":"Mood"}: ${l.mood}`),l.notes&&y.push(`${o==="ko"?"메모":"Notes"}: ${l.notes}`),y.length>0&&(u+=`- ${l.date}: ${y.join(", ")}
`)}),u+=`
`),u+=o==="ko"?`사용자 질문: ${e}

위 JSON 형식으로 답변해주세요.`:`User question: ${e}

Respond in the JSON format above.`,console.log("🤖 Sending to Gemini 2.5 Flash...");let f=(await a.generateContent(u)).response.text().trim();f.includes("```json")?f=f.split("```json")[1].split("```")[0].trim():f.includes("```")&&(f=f.split("```")[1].split("```")[0].trim());const p=JSON.parse(f);console.log("✅ Gemini response received"),console.log("🧠 Reasoning:",p.reasoning),console.log("📊 Confidence:",p.confidence);const _=[];return p.sources&&Array.isArray(p.sources)&&p.sources.forEach(l=>{_.push({type:"academic",content:l.title||"",date:l.reference||"",url:l.url})}),_.forEach(l=>{if(l.url)return;const y=T(l.content),O=T(l.date),k=ue.find(x=>{const U=T(x.source.en),H=T(x.source.ko);return!!y&&(U.includes(y)||H.includes(y))||!!O&&(U.includes(O)||H.includes(O))});k!=null&&k.source.url&&(l.url=k.source.url)}),_.length===0&&r.length>0&&r.forEach(l=>{_.push({type:"knowledge-base",content:l.source[o],url:l.source.url})}),{answer:p.answer||f,reasoning:p.reasoning,confidence:p.confidence,followUpQuestions:p.followUpQuestions||[],sources:_}}catch(a){return console.error("❌ Gemini API Error:",a),Be(t,r,o)}},Pe=async(e,t,n="ko")=>{const o=Ye(e,n);try{const s=G.getGenerativeModel({model:D}),i=n==="ko"?`당신은 고양이 전문 수의사입니다. 아래 증상을 분석하고 정확한 긴급도를 판단하세요.

고양이 정보:
- 이름: ${t.name}
- 품종: ${t.breed}
- 체중: ${t.weight}kg

증상: ${e}

긴급도 판단 기준:
- emergency (🔴 응급): 생명을 위협하는 증상 (호흡곤란, 경련, 혈변 대량, 의식 저하, 48시간 이상 식사 거부)
- warning (🟡 주의): 1-2일 관찰이 필요한 증상 (구토 1-2회, 설사, 식욕 감소, 무기력)
- mild (🟢 경미): 집에서 관찰 가능 (재채기, 가벼운 가려움, 일시적 식욕부진)

JSON 형식으로 답변:
{
  "urgency": "emergency|warning|mild",
  "analysis": "증상 분석 (2-3문장, 간결하게)",
  "recommendations": ["권장사항 1", "권장사항 2"]
}`:`You are a veterinarian specializing in cats. Analyze these symptoms and determine accurate urgency.

Cat info:
- Name: ${t.name}
- Breed: ${t.breed}
- Weight: ${t.weight}kg

Symptoms: ${e}

Urgency criteria:
- emergency (🔴): Life-threatening (breathing difficulty, seizures, heavy blood in stool, unconsciousness, refusing food 48+ hours)
- warning (🟡): Needs 1-2 day observation (vomiting 1-2x, diarrhea, decreased appetite, lethargy)
- mild (🟢): Can monitor at home (sneezing, mild itching, temporary appetite loss)

Respond in JSON:
{
  "urgency": "emergency|warning|mild",
  "analysis": "Symptom analysis (2-3 sentences, concise)",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;let c=(await s.generateContent(i)).response.text().trim();c.includes("```json")?c=c.split("```json")[1].split("```")[0].trim():c.includes("```")&&(c=c.split("```")[1].split("```")[0].trim());const m=JSON.parse(c);return{urgency:m.urgency,analysis:m.analysis,recommendations:m.recommendations||[]}}catch(s){return console.error("Symptom analysis error:",s),o}},ze=async(e,t,n="ko")=>{try{const o=G.getGenerativeModel({model:D}),s=n==="ko"?`
고양이 "${t}"에 대한 음성 입력을 분석하세요:
"${e}"

음성 입력 의도 파악 및 자동 분류 기준:
1. 식사 관련: "먹었다", "사료", "밥" → foodAmount 추출 (기본값: 50g)
2. 수분 관련: "물 마셨다", "마셨다", "물" → waterAmount 추출 (기본값: 50ml)
3. 배변 관련: "화장실", "응가", "똥" → litterCount 추출 (기본값: 1)
4. **증상 관련 (중요)**:
   - "토", "토했다", "구토", "게워냈다" → symptom 객체 생성 (type: "구토", severity: "moderate")
   - "설사" → symptom 객체 생성 (type: "설사", severity: "moderate") + litterCount도 함께 설정 (기본값: 1)
   - 다른 증상: "기침", "재채기", "무기력" 등 → symptom 객체로 처리

수치 추출 규칙:
- "50그램", "50g" → 50
- "100밀리", "100ml" → 100
- "두 번", "2번" → 2
- 수치 없으면 합리적인 기본값 사용

JSON 응답 형식:
{
  "foodAmount": 50,
  "waterAmount": null,
  "litterCount": null,
  "activityLevel": null,
  "mood": null,
  "notes": null,
  "symptom": {
    "type": "구토",
    "description": "고양이가 토했다",
    "severity": "moderate"
  }
}

**중요**:
- 증상이 감지되면 symptom 객체를 반드시 포함
- "설사"인 경우 symptom과 litterCount를 모두 설정
- 정보가 없는 필드는 포함하지 마세요
`:`
Analyze voice input for cat "${t}":
"${e}"

Intent classification rules:
1. Food-related: "ate", "fed", "food", "meal" → extract foodAmount (default: 50g)
2. Water-related: "drink", "water", "drank" → extract waterAmount (default: 50ml)
3. Litter-related: "poop", "litter", "bathroom" → extract litterCount (default: 1)
4. **Symptoms (important)**:
   - "vomit", "threw up", "vomited" → create symptom object (type: "vomit", severity: "moderate")
   - "diarrhea" → create symptom object (type: "diarrhea", severity: "moderate") + also set litterCount (default: 1)
   - Other symptoms: "cough", "sneeze", "lethargic" → process as symptom object

Number extraction:
- "50 grams", "50g" → 50
- "100ml", "100 milliliters" → 100
- "twice", "2 times" → 2
- If no number, use reasonable defaults

JSON response format:
{
  "foodAmount": 50,
  "waterAmount": null,
  "litterCount": null,
  "activityLevel": null,
  "mood": null,
  "notes": null,
  "symptom": {
    "type": "vomit",
    "description": "Cat vomited",
    "severity": "moderate"
  }
}

**Important**:
- If symptom detected, always include symptom object
- For "diarrhea", set both symptom and litterCount
- Omit fields with no data
`;console.log("🤖 Parsing voice input with Gemini...");let a=(await o.generateContent(s)).response.text().trim();a.includes("```json")?a=a.split("```json")[1].split("```")[0].trim():a.includes("```")&&(a=a.split("```")[1].split("```")[0].trim());const c=JSON.parse(a);return console.log("✅ Parsed data:",c),{...c,success:!0}}catch(o){return console.error("❌ Voice parsing error:",o),qe(e,n)}};export{Pe as a,Ve as c,je as g,ze as p,ue as v};

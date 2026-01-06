// src/host_file.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/pkg/host_file_ops.js")]
extern "C" {
    #[wasm_bindgen(js_name = host_file_read)]
    pub fn host_file_read(ref_str: &str, max_bytes: u32) -> JsValue;

    #[wasm_bindgen(js_name = host_file_write)]
    pub fn host_file_write(ref_str: &str, bytes_b64u: &str, max_bytes: u32) -> JsValue;

    #[wasm_bindgen(js_name = host_file_list)]
    pub fn host_file_list(ref_prefix: &str) -> JsValue;

    #[wasm_bindgen(js_name = host_file_stat)]
    pub fn host_file_stat(ref_str: &str) -> JsValue;
}

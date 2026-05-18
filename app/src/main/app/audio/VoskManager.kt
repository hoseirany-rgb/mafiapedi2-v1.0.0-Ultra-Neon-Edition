package com.pedram.mafiacoach.audio

import android.content.Context
import android.util.Log
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.StorageService
import java.io.IOException

class VoskManager(private val context: Context) {

    private var model: Model? = null
    private var recognizer: Recognizer? = null
    private val TAG = "VoskManager"

    // لود کردن مدل از Assets به حافظه داخلی و آماده‌سازی
    fun initModel(onReady: (Boolean) -> Unit) {
        StorageService.unpack(context, "model-fa", "model",
            { modelDir ->
                try {
                    model = Model(modelDir.absolutePath)
                    recognizer = Recognizer(model, 16000f)
                    Log.d(TAG, "Vosk Model Loaded Successfully")
                    onReady(true)
                } catch (e: IOException) {
                    Log.e(TAG, "Failed to init Vosk: ${e.message}")
                    onReady(false)
                }
            },
            { exception ->
                Log.e(TAG, "Failed to unpack model: ${exception.message}")
                onReady(false)
            }
        )
    }

    fun processAudio(data: ByteArray, length: Int): String? {
        if (recognizer?.acceptWaveForm(data, length) == true) {
            val result = recognizer?.result
            return parseText(result)
        }
        return null
    }

    private fun parseText(json: String?): String? {
        if (json.isNullOrBlank()) return null
        return try {
            JSONObject(json).optString("text", "")
        } catch (e: Exception) { null }
    }

    fun release() {
        recognizer?.close()
        model?.close()
    }
}

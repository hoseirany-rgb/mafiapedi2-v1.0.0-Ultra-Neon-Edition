val voskManager = VoskManager(this)
val analyzer = HeuristicAnalyzer()
var recorder: AudioRecorder? = null

voskManager.initModel { ready ->
    if (ready) {
        recorder = AudioRecorder { data, length ->
            val text = voskManager.processAudio(data, length)
            if (!text.isNullOrBlank()) {
                val result = analyzer.analyzeSpeech(text)
                runOnUiThread {
                    // نمایش در UI (مثلاً یک TextView یا لیست)
                    println("Analyzed: ${result.text} -> Score: ${result.score}%")
                }
            }
        }
        recorder?.start()
    }
}


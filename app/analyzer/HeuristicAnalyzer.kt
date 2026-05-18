package com.pedram.mafiacoach.analyzer

class HeuristicAnalyzer {

    // کلمات کلیدی برای تشخیص شک و اتهام
    private val suspicionWords = listOf("مافیا", "تارگت", "شک", "مشکوک", "دروغ", "گردن")
    private val townWords = listOf("شهروند", "سفید", "پاک", "تبر")

    fun analyzeSpeech(text: String): AnalysisResult {
        var suspicionScore = 0
        
        suspicionWords.forEach { word ->
            if (text.contains(word)) suspicionScore += 15
        }
        
        townWords.forEach { word ->
            if (text.contains(word)) suspicionScore -= 10
        }

        return AnalysisResult(
            text = text,
            score = suspicionScore.coerceIn(0, 100),
            summary = when {
                suspicionScore > 40 -> "پتانسیل مافیا بالا (اتهام زنی یا دفاع تهاجمی)"
                suspicionScore < 0 -> "تلاش برای شهروندنمایی"
                else -> "دیالوگ خنثی"
            }
        )
    }
}

data class AnalysisResult(val text: String, val score: Int, val summary: String)


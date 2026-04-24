package com.example.myapp

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.myapp.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var count = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Restore count if activity was recreated (e.g., screen rotation)
        count = savedInstanceState?.getInt(KEY_COUNT) ?: 0
        updateCountDisplay()

        binding.btnIncrement.setOnClickListener {
            count++
            updateCountDisplay()
        }

        binding.btnDecrement.setOnClickListener {
            if (count > 0) {
                count--
                updateCountDisplay()
            }
        }

        binding.btnReset.setOnClickListener {
            count = 0
            updateCountDisplay()
        }

        binding.btnCoffeeMaker.setOnClickListener {
            startActivity(Intent(this, CoffeeMakerActivity::class.java))
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putInt(KEY_COUNT, count)
    }

    private fun updateCountDisplay() {
        binding.tvCount.text = count.toString()
        binding.btnDecrement.isEnabled = count > 0
    }

    companion object {
        private const val KEY_COUNT = "count"
    }
}

package com.mms.mdstudio

import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.widget.ProgressBar
import android.widget.RadioButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton

class CoffeeMakerActivity : AppCompatActivity() {

    private enum class BrewState { IDLE, BREWING, DONE }

    private lateinit var tvStatus: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBrew: MaterialButton
    private lateinit var btnReset: MaterialButton

    private var state = BrewState.IDLE
    private var brewTimer: CountDownTimer? = null

    private val coffeeRadioIds = listOf(
        R.id.rb_espresso, R.id.rb_cappuccino, R.id.rb_latte, R.id.rb_americano
    )
    private val sizeRadioIds = listOf(
        R.id.rb_small, R.id.rb_medium, R.id.rb_large
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_coffee_maker)

        supportActionBar?.title = getString(R.string.coffee_maker_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        tvStatus = findViewById(R.id.tv_status)
        progressBar = findViewById(R.id.progress_brew)
        btnBrew = findViewById(R.id.btn_brew)
        btnReset = findViewById(R.id.btn_reset_coffee)

        savedInstanceState?.let {
            state = BrewState.valueOf(it.getString(KEY_STATE, BrewState.IDLE.name))
            if (state == BrewState.BREWING) state = BrewState.IDLE
            applyState()
        }

        btnBrew.setOnClickListener { startBrewing() }
        btnReset.setOnClickListener { resetMaker() }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(KEY_STATE, state.name)
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    override fun onDestroy() {
        super.onDestroy()
        brewTimer?.cancel()
    }

    private fun selectedCoffee(): String {
        for (id in coffeeRadioIds) {
            val rb = findViewById<RadioButton>(id)
            if (rb.isChecked) return rb.text.toString()
        }
        return getString(R.string.coffee_espresso)
    }

    private fun selectedSize(): String {
        for (id in sizeRadioIds) {
            val rb = findViewById<RadioButton>(id)
            if (rb.isChecked) return rb.text.toString()
        }
        return getString(R.string.size_medium)
    }

    private fun brewDurationMs(): Long {
        return when (selectedSize()) {
            getString(R.string.size_small) -> 3000L
            getString(R.string.size_large) -> 6000L
            else -> 4500L
        }
    }

    private fun startBrewing() {
        if (state == BrewState.BREWING) return
        state = BrewState.BREWING
        applyState()

        val duration = brewDurationMs()
        progressBar.max = duration.toInt()

        brewTimer = object : CountDownTimer(duration, 100) {
            override fun onTick(millisUntilFinished: Long) {
                progressBar.progress = (duration - millisUntilFinished).toInt()
            }

            override fun onFinish() {
                progressBar.progress = progressBar.max
                state = BrewState.DONE
                applyState()
            }
        }.start()
    }

    private fun resetMaker() {
        brewTimer?.cancel()
        progressBar.progress = 0
        state = BrewState.IDLE
        applyState()
    }

    private fun applyState() {
        when (state) {
            BrewState.IDLE -> {
                tvStatus.text = getString(R.string.status_idle)
                progressBar.visibility = View.INVISIBLE
                btnBrew.isEnabled = true
                btnReset.visibility = View.GONE
                setOptionsEnabled(true)
            }
            BrewState.BREWING -> {
                tvStatus.text = getString(R.string.status_brewing, selectedCoffee(), selectedSize())
                progressBar.visibility = View.VISIBLE
                btnBrew.isEnabled = false
                btnReset.visibility = View.GONE
                setOptionsEnabled(false)
            }
            BrewState.DONE -> {
                tvStatus.text = getString(R.string.status_done, selectedCoffee())
                progressBar.visibility = View.INVISIBLE
                btnBrew.isEnabled = false
                btnReset.visibility = View.VISIBLE
                setOptionsEnabled(false)
            }
        }
    }

    private fun setOptionsEnabled(enabled: Boolean) {
        (coffeeRadioIds + sizeRadioIds).forEach { id ->
            findViewById<RadioButton>(id).isEnabled = enabled
        }
    }

    companion object {
        private const val KEY_STATE = "brew_state"
    }
}

package com.example.myapp

import org.junit.Test
import org.junit.Assert.*

/**
 * Example local unit test, which will execute on the development machine (host).
 */
class ExampleUnitTest {
    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)
    }

    @Test
    fun counter_incrementsCorrectly() {
        var count = 0
        count++
        assertEquals(1, count)
    }

    @Test
    fun counter_doesNotGoBelowZero() {
        var count = 0
        if (count > 0) count--
        assertEquals(0, count)
    }

    @Test
    fun counter_resetsToZero() {
        var count = 5
        count = 0
        assertEquals(0, count)
    }
}

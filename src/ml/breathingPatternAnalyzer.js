/**
 * Advanced Breathing Pattern Analyzer
 * 
 * Analyzes ML breathing phase predictions to detect rhythmic patterns
 * and generates normalized signals for organic visual feedback
 */

class BreathingPatternAnalyzer {
  constructor() {
    // Pattern detection parameters
    this.cycleHistory = [] // Complete breathing cycles (limited for performance)
    this.totalCyclesCount = 0 // True total count (never resets)
    this.phaseTransitions = [] // Phase change timestamps
    this.patternMetrics = {
      cycleConsistency: 0,    // How consistent are cycle durations?
      rhythmStrength: 0,      // How rhythmic is the breathing?
      patternStability: 0,    // How stable is the current pattern?
      overallScore: 0         // Combined pattern quality score
    }
    
    // Configuration - More relaxed for better detection
    this.minCycleDuration = 1000   // Minimum 1 second per cycle (was 2s)
    this.maxCycleDuration = 20000  // Maximum 20 seconds per cycle (was 15s)
    this.historySize = 50          // Keep last 50 cycles for analysis
    this.transitionHistorySize = 50 // Keep 50 recent transitions
    this.minPhaseDuration = 300    // Minimum 300ms per phase to avoid noise
    
    // Pattern signal generation
    this.currentPatternSignal = 0   // 0-1 normalized pattern strength
    this.signalSmoothing = 0.1      // Smoothing factor for signal changes
    this.baselineNoise = 0.05       // Minimum signal level for no pattern
    
    // Cycle detection state
    this.currentCycle = null
    this.lastPhase = 'inhale'
    this.lastPhaseTime = Date.now()
  }

  /**
   * Process a new ML breathing prediction
   * @param {Object} prediction - ML model prediction with phase, confidence, etc.
   * @returns {Object} Updated pattern analysis results
   */
  processPrediction(prediction) {
    const now = Date.now()
    const { phase, confidence, probabilities } = prediction
    
    // Lower confidence threshold for better detection (was 0.6)
    if (confidence < 0.4) {
      return this.getCurrentAnalysis()
    }
    
    // Detect phase transitions
    if (phase !== this.lastPhase) {
      this.recordPhaseTransition(this.lastPhase, phase, now)
      this.lastPhase = phase
      this.lastPhaseTime = now
    }
    
    // Update current cycle tracking
    this.updateCurrentCycle(phase, now, confidence)
    
    // Analyze pattern metrics
    this.analyzePatternMetrics()
    
    // Generate normalized pattern signal
    this.updatePatternSignal()
    
    return this.getCurrentAnalysis()
  }

  /**
   * Record a phase transition for pattern analysis
   */
  recordPhaseTransition(fromPhase, toPhase, timestamp) {
    const phaseDuration = timestamp - this.lastPhaseTime
    
    // Filter out very short phases to reduce noise
    if (phaseDuration < this.minPhaseDuration) {
      console.log(`⚠️ Filtering short phase: ${fromPhase}→${toPhase} (${phaseDuration}ms)`)
      return
    }
    
    const transition = {
      from: fromPhase,
      to: toPhase,
      timestamp: timestamp,
      duration: phaseDuration
    }
    
    console.log(`🔄 Phase transition: ${fromPhase}→${toPhase} (${(phaseDuration/1000).toFixed(1)}s)`)
    
    this.phaseTransitions.push(transition)
    
    // Keep history manageable
    if (this.phaseTransitions.length > this.transitionHistorySize) {
      this.phaseTransitions.shift()
    }
    
    // Check if this completes a breathing cycle
    this.checkForCompleteCycle(transition)
  }

  /**
   * Check if recent transitions form a complete breathing cycle
   */
  checkForCompleteCycle(newTransition) {
    if (this.phaseTransitions.length < 2) return
    
    // Look for a complete cycle pattern in recent transitions
    // For 2-class system: inhale -> exhale -> inhale (or exhale -> inhale -> exhale)
    const recent = this.phaseTransitions.slice(-3) // Last 3 transitions
    
    // Simple cycle detection: look for alternating inhale/exhale
    if (recent.length >= 2) {
      const lastTransition = recent[recent.length - 1]
      const prevTransition = recent[recent.length - 2]
      
      // Check for alternating pattern
      const isAlternating = (
        (lastTransition.to === 'inhale' && prevTransition.to === 'exhale') ||
        (lastTransition.to === 'exhale' && prevTransition.to === 'inhale')
      )
      
      if (isAlternating) {
        const cycleDuration = lastTransition.timestamp - prevTransition.timestamp
        
        // Validate cycle duration
        if (cycleDuration >= this.minCycleDuration && cycleDuration <= this.maxCycleDuration) {
          this.recordCompleteCycle({
            startTime: prevTransition.timestamp,
            endTime: lastTransition.timestamp,
            duration: cycleDuration,
            transitions: [prevTransition, lastTransition],
            hasInhale: true,
            hasExhale: true
          })
        }
      }
    }
  }

  /**
   * Record a complete breathing cycle
   */
  recordCompleteCycle(cycle) {
    this.cycleHistory.push(cycle)
    this.totalCyclesCount++ // Track true total count
    
    // Keep history manageable
    if (this.cycleHistory.length > this.historySize) {
      this.cycleHistory.shift()
    }
    
    console.log(`🔄 Breathing cycle detected: ${(cycle.duration / 1000).toFixed(1)}s (total: ${this.totalCyclesCount})`)
  }

  /**
   * Update current cycle tracking
   */
  updateCurrentCycle(phase, timestamp, confidence) {
    if (!this.currentCycle) {
      // Always start tracking a cycle with any phase
      this.currentCycle = {
        startTime: timestamp,
        phases: [{ phase, timestamp, confidence }]
      }
    } else {
      this.currentCycle.phases.push({ phase, timestamp, confidence })
      
      // Check if cycle is getting too long
      const duration = timestamp - this.currentCycle.startTime
      if (duration > this.maxCycleDuration) {
        this.currentCycle = null // Reset if too long
      }
    }
  }

  /**
   * Analyze pattern metrics from cycle history
   */
  analyzePatternMetrics() {
    // Give partial credit for fewer cycles (was 3, now 2)
    if (this.cycleHistory.length < 2) {
      this.patternMetrics = {
        cycleConsistency: 0,
        rhythmStrength: 0,
        patternStability: 0,
        overallScore: 0
      }
      return
    }
    
    // If we have only 2 cycles, give them some base credit
    if (this.cycleHistory.length === 2) {
      this.patternMetrics = {
        cycleConsistency: 0.5, // Some base consistency
        rhythmStrength: 0.4,   // Some rhythm detected
        patternStability: 0.3, // Building stability
        overallScore: 0.4      // Enough to register as a pattern
      }
      return
    }

    // 1. CYCLE CONSISTENCY
    // Measure how similar cycle durations are
    const durations = this.cycleHistory.map(cycle => cycle.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = stdDev / avgDuration
    
    // Lower variation = higher consistency
    const cycleConsistency = Math.max(0, 1 - (coefficientOfVariation * 2))

    // 2. RHYTHM STRENGTH
    // Measure regularity of phase transitions
    const recentTransitions = this.phaseTransitions.slice(-20)
    let rhythmScore = 0
    
    if (recentTransitions.length >= 6) {
      // Check for regular patterns in transition timing
      const transitionIntervals = []
      for (let i = 1; i < recentTransitions.length; i++) {
        transitionIntervals.push(recentTransitions[i].timestamp - recentTransitions[i-1].timestamp)
      }
      
      if (transitionIntervals.length >= 3) {
        const avgInterval = transitionIntervals.reduce((a, b) => a + b, 0) / transitionIntervals.length
        const intervalVariance = transitionIntervals.reduce((sum, interval) => 
          sum + Math.pow(interval - avgInterval, 2), 0) / transitionIntervals.length
        const intervalStdDev = Math.sqrt(intervalVariance)
        const intervalCV = intervalStdDev / avgInterval
        
        rhythmScore = Math.max(0, 1 - (intervalCV * 1.5))
      }
    }

    // 3. PATTERN STABILITY
    // Measure consistency over time
    let patternStability = 0
    if (this.cycleHistory.length >= 5) {
      const recent5 = this.cycleHistory.slice(-5)
      const recentAvg = recent5.reduce((sum, c) => sum + c.duration, 0) / recent5.length
      const recentStdDev = Math.sqrt(recent5.reduce((sum, c) => 
        sum + Math.pow(c.duration - recentAvg, 2), 0) / recent5.length)
      patternStability = Math.max(0, 1 - (recentStdDev / recentAvg))
    }

    // 4. OVERALL SCORE
    // Weighted combination of all metrics
    const overallScore = (
      cycleConsistency * 0.4 +
      rhythmScore * 0.35 +
      patternStability * 0.25
    )

    this.patternMetrics = {
      cycleConsistency,
      rhythmStrength: rhythmScore,
      patternStability,
      overallScore
    }
  }

  /**
   * Generate normalized pattern signal for sphere distortion
   */
  updatePatternSignal() {
    const { overallScore } = this.patternMetrics
    
    // Target signal based on pattern quality
    let targetSignal = this.baselineNoise
    
    if (overallScore > 0.2) { // Lowered from 0.3 to 0.2
      // Good pattern detected - scale signal based on quality
      const patternStrength = Math.pow(overallScore, 0.8) // Gentle curve
      targetSignal = this.baselineNoise + (patternStrength * (1 - this.baselineNoise))
    }
    
    // Smooth signal changes to avoid jarring transitions
    this.currentPatternSignal = this.lerp(
      this.currentPatternSignal, 
      targetSignal, 
      this.signalSmoothing
    )
  }

  /**
   * Get current breathing pattern analysis
   */
  getCurrentAnalysis() {
    const recentCycle = this.cycleHistory[this.cycleHistory.length - 1]
    
    return {
      // Pattern metrics
      patternMetrics: { ...this.patternMetrics },
      
      // Normalized signal for visual feedback
      patternSignal: this.currentPatternSignal, // 0-1 normalized
      
      // Pattern detection status
      isPatternDetected: this.patternMetrics.overallScore > 0.3,
      patternQuality: this.getPatternQualityLabel(),
      
      // Cycle information
      totalCycles: this.totalCyclesCount,
      lastCycleDuration: recentCycle ? recentCycle.duration : null,
      averageCycleDuration: this.getAverageCycleDuration(),
      
      // Recent activity
      recentTransitions: this.phaseTransitions.slice(-5),
      currentCycleActive: !!this.currentCycle,
      
      // Debugging info
      cycleHistory: this.cycleHistory.slice(-3), // Last 3 cycles
      rawMetrics: {
        cycleConsistency: this.patternMetrics.cycleConsistency,
        rhythmStrength: this.patternMetrics.rhythmStrength,
        patternStability: this.patternMetrics.patternStability
      }
    }
  }

  /**
   * Get human-readable pattern quality label
   */
  getPatternQualityLabel() {
    const score = this.patternMetrics.overallScore
    
    if (score < 0.2) return 'No Pattern'
    if (score < 0.4) return 'Weak Pattern' 
    if (score < 0.6) return 'Moderate Pattern'
    if (score < 0.8) return 'Strong Pattern'
    return 'Excellent Pattern'
  }

  /**
   * Get average cycle duration in milliseconds
   */
  getAverageCycleDuration() {
    if (this.cycleHistory.length === 0) return null
    
    const total = this.cycleHistory.reduce((sum, cycle) => sum + cycle.duration, 0)
    return total / this.cycleHistory.length
  }

  /**
   * Generate breathing pattern visualization data
   */
  getVisualizationData() {
    const now = Date.now()
    const timeWindow = 30000 // 30 seconds
    
    // Get recent phase data for timeline visualization
    const recentPhases = this.phaseTransitions
      .filter(t => (now - t.timestamp) < timeWindow)
      .map(t => ({
        phase: t.to,
        timestamp: t.timestamp,
        relativeTime: (t.timestamp - (now - timeWindow)) / timeWindow // 0-1
      }))
    
    // Get cycle visualization data
    const recentCycles = this.cycleHistory
      .filter(c => (now - c.endTime) < timeWindow)
      .map(c => ({
        duration: c.duration,
        startTime: c.startTime,
        endTime: c.endTime,
        relativeStart: (c.startTime - (now - timeWindow)) / timeWindow,
        relativeEnd: (c.endTime - (now - timeWindow)) / timeWindow
      }))
    
    return {
      timeWindow,
      recentPhases,
      recentCycles,
      patternSignalHistory: [this.currentPatternSignal], // Could extend to keep history
      currentSignal: this.currentPatternSignal
    }
  }

  /**
   * Linear interpolation helper
   */
  lerp(start, end, factor) {
    return start + (end - start) * factor
  }

  /**
   * Reset analyzer state
   */
  reset() {
    this.cycleHistory = []
    this.totalCyclesCount = 0 // Reset total count
    this.phaseTransitions = []
    this.patternMetrics = {
      cycleConsistency: 0,
      rhythmStrength: 0, 
      patternStability: 0,
      overallScore: 0
    }
    this.currentPatternSignal = this.baselineNoise
    this.currentCycle = null
    this.lastPhase = 'inhale'
    this.lastPhaseTime = Date.now()
  }

  /**
   * Export pattern data for analysis or debugging
   */
  exportData() {
    return {
      cycleHistory: this.cycleHistory,
      phaseTransitions: this.phaseTransitions,
      patternMetrics: this.patternMetrics,
      currentPatternSignal: this.currentPatternSignal,
      timestamp: Date.now()
    }
  }

  /**
   * Import previously exported pattern data
   */
  importData(data) {
    if (data.cycleHistory) this.cycleHistory = data.cycleHistory
    if (data.phaseTransitions) this.phaseTransitions = data.phaseTransitions
    if (data.patternMetrics) this.patternMetrics = data.patternMetrics
    if (data.currentPatternSignal) this.currentPatternSignal = data.currentPatternSignal
  }
}

export default BreathingPatternAnalyzer

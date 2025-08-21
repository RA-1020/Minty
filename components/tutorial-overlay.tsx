"use client"

import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react'
import { useTutorial } from '@/lib/tutorial-context'
import { cn } from '@/lib/utils'

interface Position {
  top?: number | string
  left?: number | string
  right?: number | string
  bottom?: number | string
  transform?: string
}

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    currentTutorial,
    nextStep,
    prevStep,
    closeTutorial,
    restartTutorial,
    currentPage,
    isTransitioning
  } = useTutorial()

  const [position, setPosition] = useState<Position>({})
  const [isVisible, setIsVisible] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentStepData = currentTutorial[currentStep]
  const progress = ((currentStep + 1) / currentTutorial.length) * 100

  // Calculate position with enhanced logic
  const calculatePosition = (target?: string, placement?: string) => {
    if (!target || placement === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const targetElement = document.querySelector(`[data-tutorial="${target}"]`)
    if (!targetElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const rect = targetElement.getBoundingClientRect()
    const cardWidth = 420
    const cardHeight = 320
    const margin = 24

    let newPosition: Position = {}

    // Special handling for financial metrics to position below the highlighted section
    if (target === 'metrics') {
      // Position the card closer to the metrics cards
      const centerX = rect.left + (rect.width / 2)
      newPosition = {
        top: rect.bottom + 40, // Closer to the highlighted section
        left: centerX - (cardWidth / 2) // Center horizontally with the metrics
      }
    } else if (target === 'budget-alerts') {
      // Position Budget Alerts tutorial card to the left of the highlighted section
      newPosition = {
        top: rect.top + (rect.height / 2) - (cardHeight / 2), // Vertically center with the section
        left: rect.left - cardWidth - margin - 20 // Position to the left with spacing
      }
    } else if (target === 'recent-transactions') {
      // Position Recent Activity tutorial card closer to the highlighted section
      newPosition = {
        top: rect.top + 20, // Close to the target element
        left: rect.right + margin + 20 // Just to the right of the highlighted section
      }
    } else if (target === 'charts' || target === 'spending-chart') {
      // Position charts tutorial cards closer to the highlighted chart section
      newPosition = {
        top: rect.bottom + margin + 10, // Just below the highlighted chart
        left: rect.left + (rect.width / 2) - (cardWidth / 2) // Centered under the chart
      }
    } else {
      // Original positioning logic for other elements
      switch (placement) {
        case 'top':
          const spaceAbove = rect.top - margin
          if (spaceAbove < cardHeight) {
            newPosition = {
              top: rect.top + (rect.height / 2) - (cardHeight / 2),
              left: rect.right + margin
            }
          } else {
            newPosition = {
              top: Math.max(margin, rect.top - cardHeight - margin),
              left: rect.left + (rect.width / 2) - (cardWidth / 2)
            }
          }
          break
        case 'bottom':
          newPosition = {
            top: rect.bottom + margin,
            left: rect.left + (rect.width / 2) - (cardWidth / 2)
          }
          break
        case 'left':
          newPosition = {
            top: rect.top + (rect.height / 2) - (cardHeight / 2),
            left: Math.max(margin, rect.left - cardWidth - margin)
          }
          break
        case 'right':
          newPosition = {
            top: rect.top + (rect.height / 2) - (cardHeight / 2),
            left: rect.right + margin
          }
          break
        default:
          newPosition = {
            top: rect.bottom + margin,
            left: rect.left + (rect.width / 2) - (cardWidth / 2)
          }
      }
    }

    // Enhanced viewport boundary detection
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Horizontal constraints
    if (typeof newPosition.left === 'number') {
      if (newPosition.left < margin) {
        newPosition.left = margin
      } else if (newPosition.left + cardWidth > viewport.width - margin) {
        newPosition.left = viewport.width - cardWidth - margin
      }
    }

    // Vertical constraints - less aggressive for metrics to allow positioning below
    if (typeof newPosition.top === 'number') {
      if (newPosition.top < margin) {
        newPosition.top = margin
      } else if (newPosition.top + cardHeight > viewport.height - margin && target !== 'metrics') {
        newPosition.top = viewport.height - cardHeight - margin
      }
    }

    return newPosition
  }

  // Enhanced visibility management with animations
  useEffect(() => {
    if (isActive && currentStepData) {
      // Check if we're on the right page for this step
      if (currentStepData.showOnPage && currentStepData.showOnPage !== currentPage) {
        setIsVisible(false)
        setCardVisible(false)
        return
      }

      setIsVisible(true)
      
      const updatePosition = () => {
        const newPosition = calculatePosition(currentStepData.target, currentStepData.placement)
        setPosition(newPosition)
      }

      // Position calculation with proper timing for scroll completion
      const delay = currentStepData.target === 'metrics' ? 600 : 0 // Faster but still correct
      setTimeout(() => {
        updatePosition()
        setCardVisible(true)
      }, delay)

      // Update position on resize
      const handleResize = () => updatePosition()
      window.addEventListener('resize', handleResize)
      
      return () => window.removeEventListener('resize', handleResize)
    } else {
      setCardVisible(false)
      setTimeout(() => setIsVisible(false), 100) // Reduced from 150ms
    }
  }, [isActive, currentStepData, currentPage])

  // Handle background clicks
  // Update the highlight position when target changes
  useEffect(() => {
    if (currentStepData?.target) {
      const updateHighlightPosition = () => {
        const targetElement = document.querySelector(`[data-tutorial="${currentStepData.target}"]`)
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect()
          const highlightElement = document.querySelector('.tutorial-highlight-overlay') as HTMLElement
          if (highlightElement) {
            highlightElement.style.top = `${rect.top - 8}px`
            highlightElement.style.left = `${rect.left - 8}px`
            highlightElement.style.width = `${rect.width + 16}px`
            highlightElement.style.height = `${rect.height + 16}px`
          }
        }
      }

      // Initial positioning
      setTimeout(updateHighlightPosition, 100)
      
      // Update on window resize
      window.addEventListener('resize', updateHighlightPosition)
      window.addEventListener('scroll', updateHighlightPosition)
      
      return () => {
        window.removeEventListener('resize', updateHighlightPosition)
        window.removeEventListener('scroll', updateHighlightPosition)
      }
    }
  }, [currentStepData?.target])

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !currentStepData?.allowClickthrough) {
      closeTutorial()
    }
  }

  // Handle step transitions
  const handleNext = () => {
    // Don't hide the card first - let the tutorial context handle the transition
    nextStep()
  }

  const handlePrevious = () => {
    // Don't hide the card first - let the tutorial context handle the transition  
    prevStep()
  }

  const handleRestart = () => {
    setCardVisible(false)
    setTimeout(() => {
      restartTutorial()
    }, 200)
  }

  const handleClose = () => {
    setCardVisible(false)
    setTimeout(() => {
      closeTutorial()
    }, 300)
  }

  if (!isActive || !isVisible || !currentStepData) {
    return null
  }

  return (
    <>
      
      <div
        className={cn(
          "fixed inset-0 z-[9999] transition-all duration-500 ease-out",
          currentStepData?.allowClickthrough 
            ? "bg-transparent pointer-events-none" 
            : "bg-gradient-to-br from-black/5 via-black/3 to-black/5",
          "tutorial-backdrop"
        )}
        onClick={currentStepData?.allowClickthrough ? undefined : handleBackgroundClick}
      >
        
        {currentStepData.target && (
          <div 
            className="tutorial-highlight-overlay absolute pointer-events-none transition-all duration-700 ease-out"
            style={{
              outline: '3px solid rgba(59, 130, 246, 0.8)',
              outlineOffset: '2px',
              borderRadius: '8px',
              zIndex: 9998,
              backgroundColor: currentStepData?.allowClickthrough ? 'transparent' : 'rgba(59, 130, 246, 0.05)'
            }}
          />
        )}

        
        <div
          ref={cardRef}
          className={cn(
            "absolute w-[420px] transition-all duration-200 ease-out pointer-events-auto",
            "bg-white/98 dark:bg-gray-900/98",
            "border border-white/30 dark:border-gray-700/50",
            "shadow-2xl shadow-black/20 dark:shadow-black/40",
            "rounded-2xl overflow-hidden",
            cardVisible && !isTransitioning ? "tutorial-card-enter opacity-100 scale-100" : "opacity-0 scale-95",
            isTransitioning && "tutorial-card-exit",
            // Lower z-index when clickthrough is enabled to avoid blocking
            currentStepData?.allowClickthrough ? "z-[9997]" : "z-[10001]"
          )}
          style={position}
        >
          
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 p-1">
            <div className="bg-white/95 dark:bg-gray-900/95 rounded-xl p-6 pb-4">
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {currentStepData.title}
                    </h3>
                  </div>
                  
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="font-medium">Step {currentStep + 1} of {currentTutorial.length}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 -mt-1 -mr-1 rounded-full h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">
                  {currentStepData.description}
                </p>
              </div>

              
              <div className="mb-6">
                <Progress 
                  value={progress} 
                  className="h-3 bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tutorial Progress
                  </p>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {currentStep + 1}/{currentTutorial.length} completed
                  </p>
                </div>
              </div>

              
              {currentStepData.allowClickthrough && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Interactive Step
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Click the highlighted <strong>Categories</strong> link in the sidebar to navigate, then press "Next" to continue the tutorial.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || isTransitioning}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestart}
                    disabled={isTransitioning}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                  </Button>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={isTransitioning}
                  size="sm"
                  className={cn(
                    "flex items-center gap-1.5 font-medium transition-all duration-200",
                    "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                    "text-white shadow-lg hover:shadow-xl transform hover:scale-105",
                    "disabled:opacity-50 disabled:transform-none disabled:shadow-lg"
                  )}
                >
                  {currentStep === currentTutorial.length - 1 ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <style jsx global>{`
        .tutorial-card-enter {
          animation: tutorialCardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .tutorial-card-exit {
          animation: tutorialCardExit 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .tutorial-backdrop {
          animation: tutorialBackdropEnter 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes tutorialCardEnter {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
            filter: blur(4px);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.02);
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
        
        @keyframes tutorialCardExit {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
            filter: blur(2px);
          }
        }
        
        @keyframes tutorialBackdropEnter {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}

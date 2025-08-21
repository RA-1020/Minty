"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { MAIN_TUTORIAL_STEPS, CATEGORY_TUTORIAL_STEPS, DASHBOARD_TUTORIAL_STEPS, type TutorialStep } from '@/lib/tutorial-steps'

interface TutorialContextType {
  isActive: boolean
  currentStep: number
  currentTutorial: TutorialStep[]
  startTutorial: (tutorialType?: 'main' | 'category' | 'dashboard') => void
  nextStep: () => void
  prevStep: () => void
  closeTutorial: () => void
  restartTutorial: () => void
  setCurrentPage: (page: string) => void
  currentPage: string
  isTransitioning: boolean
  highlightElement: (target: string) => void
  removeHighlight: () => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ 
  children, 
  onNavigate 
}: { 
  children: React.ReactNode
  onNavigate?: (page: string) => void 
}) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [currentTutorial, setCurrentTutorial] = useState<TutorialStep[]>(MAIN_TUTORIAL_STEPS)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { user, profile } = useAuth()
  const transitionTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-start tutorial for new users
  useEffect(() => {
    if (user && profile && !hasCompletedTutorial) {
      const checkAndStartTutorial = async () => {
        try {
          // Check if user has completed tutorial
          const tutorialCompleted = localStorage.getItem(`tutorial-completed-${user.id}`)
          
          if (!tutorialCompleted) {
            // Check if user is new (created within last 10 minutes)
            const accountAge = profile.created_at ? 
              Date.now() - new Date(profile.created_at).getTime() : 
              Infinity
            
            const isNewUser = accountAge < 10 * 60 * 1000 // 10 minutes
            
            if (isNewUser) {
              // Auto-start tutorial for new users with a delay
              setTimeout(() => {
                startTutorial('main')
              }, 2000)
            }
          }
        } catch (error) {
          console.error('Error checking tutorial status:', error)
        }
      }

      checkAndStartTutorial()
    }
  }, [user, profile, hasCompletedTutorial])

  // Handle page changes during tutorial
  useEffect(() => {
    if (isActive && currentTutorial[currentStep]) {
      const step = currentTutorial[currentStep]
      
      // Check if we need to be on a specific page
      if (step.showOnPage && step.showOnPage !== currentPage) {
        // Hide tutorial temporarily while on wrong page
        return
      }
      
      // Auto-highlight target elements
      if (step.target) {
        setTimeout(() => {
          highlightElement(step.target!)
          
          // Auto-scroll for specific tutorial steps
          if (step.id === 'recent-transactions') {
            
            const element = document.querySelector(`[data-tutorial="${step.target}"]`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          } else if (step.id === 'financial-metrics') {
            const element = document.querySelector(`[data-tutorial="${step.target}"]`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
            }
          }
        }, 500)
      }
    }
  }, [currentPage, isActive, currentStep, currentTutorial])

  const highlightElement = useCallback((target: string) => {
    removeHighlight()
    
    const element = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement
    if (element) {
      element.classList.add('tutorial-highlight')
      
      // Add pulsing animation
      element.style.animation = 'tutorial-pulse 2s infinite'
      element.style.position = 'relative'
      element.style.zIndex = '9998'
    }
  }, [])

  const removeHighlight = useCallback(() => {
    const highlighted = document.querySelectorAll('.tutorial-highlight')
    highlighted.forEach(element => {
      const htmlElement = element as HTMLElement
      htmlElement.classList.remove('tutorial-highlight')
      htmlElement.style.animation = ''
      htmlElement.style.position = ''
      htmlElement.style.zIndex = ''
    })
  }, [])

  const startTutorial = useCallback((tutorialType: 'main' | 'category' | 'dashboard' = 'main') => {
    let steps: TutorialStep[]
    
    switch (tutorialType) {
      case 'category':
        steps = CATEGORY_TUTORIAL_STEPS
        break
      case 'dashboard':
        steps = DASHBOARD_TUTORIAL_STEPS
        break
      default:
        steps = MAIN_TUTORIAL_STEPS
    }
    
    console.log('Starting Tutorial:', {
      type: tutorialType,
      totalSteps: steps.length,
      firstStep: steps[0]?.id,
      lastStep: steps[steps.length - 1]?.id
    })
    
    setCurrentTutorial(steps)
    setCurrentStep(0)
    setIsActive(true)
    
    // Start tutorial with smooth fade-in
    setIsTransitioning(true)
    setTimeout(() => setIsTransitioning(false), 300)
  }, [])

  const nextStep = useCallback(() => {
    const currentStepData = currentTutorial[currentStep]
    
    console.log('Tutorial Debug:', {
      currentStep,
      totalSteps: currentTutorial.length,
      currentStepId: currentStepData?.id,
      nextStepExists: currentStep < currentTutorial.length - 1
    })
    
    setIsTransitioning(true)
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }
    
    // Handle navigation if needed
    if (currentStepData?.navigateTo && onNavigate) {
      onNavigate(currentStepData.navigateTo)
      
      // Wait for navigation to complete
      transitionTimeoutRef.current = setTimeout(() => {
        if (currentStep < currentTutorial.length - 1) {
          setCurrentStep(prev => prev + 1)
        } else {
          // Tutorial completed
          completeAndCloseTutorial()
        }
        setIsTransitioning(false)
      }, 500) // Reduced from 600ms
    } else {
      // No navigation needed - immediate transition
      if (currentStep < currentTutorial.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        completeAndCloseTutorial()
      }
      setIsTransitioning(false)
    }
  }, [currentStep, currentTutorial, onNavigate, user])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setIsTransitioning(true)
      
      // Immediate transition for previous step
      setCurrentStep(prev => prev - 1)
      setIsTransitioning(false)
    }
  }, [currentStep])

  const completeAndCloseTutorial = useCallback(() => {
    setIsTransitioning(true)
    
    setTimeout(() => {
      if (user) {
        localStorage.setItem(`tutorial-completed-${user.id}`, 'true')
      }
      setHasCompletedTutorial(true)
      setIsActive(false)
      removeHighlight()
      setIsTransitioning(false)
    }, 300)
  }, [user, removeHighlight])

  const closeTutorial = useCallback(() => {
    completeAndCloseTutorial()
  }, [completeAndCloseTutorial])

  const restartTutorial = useCallback(() => {
    setIsTransitioning(true)
    
    setTimeout(() => {
      setCurrentStep(0)
      setIsTransitioning(false)
    }, 300)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      removeHighlight()
    }
  }, [removeHighlight])

  const value = {
    isActive,
    currentStep,
    currentTutorial,
    startTutorial,
    nextStep,
    prevStep,
    closeTutorial,
    restartTutorial,
    setCurrentPage,
    currentPage,
    isTransitioning,
    highlightElement,
    removeHighlight
  }

  return (
    <TutorialContext.Provider value={value}>
      {children}
      
      
      <style jsx global>{`
        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            transform: scale(1.02);
          }
        }
        
        @keyframes tutorial-fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes tutorial-fade-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
        }
        
        @keyframes tutorial-backdrop-in {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }
        
        .tutorial-highlight {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 8px;
        }
        
        .tutorial-card-enter {
          animation: tutorial-fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .tutorial-card-exit {
          animation: tutorial-fade-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .tutorial-backdrop {
          animation: tutorial-backdrop-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}

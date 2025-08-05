"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Bot, User, Loader2, Sparkles, TrendingUp, DollarSign, PieChart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickQuestions = [
  { text: "How much did I spend this month?", icon: DollarSign },
  { text: "What's my biggest expense category?", icon: PieChart },
  { text: "Am I staying within my budget?", icon: TrendingUp },
  { text: "Show me my spending trends", icon: TrendingUp },
  { text: "What can I do to save more money?", icon: Sparkles },
]

export default function FinancialChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input
    if (!textToSend.trim() || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Fetch user's financial data
      const financialData = await fetchUserFinancialData()
      
      // Send to API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          financialData,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to get response from AI assistant')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while analyzing your financial data. Please try again or check if your Groq API key is set up correctly.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserFinancialData = async () => {
    if (!user) throw new Error('User not authenticated')

    // Get recent transactions, budgets, categories
    const [transactionsResult, budgetsResult, categoriesResult] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, color)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100), // Increased to 100 for better analysis
      supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
    ])

    if (transactionsResult.error) throw transactionsResult.error
    if (budgetsResult.error) throw budgetsResult.error
    if (categoriesResult.error) throw categoriesResult.error

    const transactions = transactionsResult.data || []
    const budgets = budgetsResult.data || []
    const categories = categoriesResult.data || []

    return {
      transactions,
      budgets,
      categories,
      summary: {
        totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        transactionCount: transactions.length
      }
    }
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <span>Minty AI Assistant</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ask me anything about your finances! I can analyze your spending, budgets, and help you make better financial decisions.
        </p>
      </div>

      <Card className="h-[calc(100vh-200px)] flex flex-col bg-white dark:bg-gray-800 border shadow-lg">
        <CardHeader className="pb-4 bg-white dark:bg-gray-800 border-b">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Financial Assistant</span>
            <Badge variant="secondary" className="ml-auto">
              Powered by Groq AI
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 bg-white dark:bg-gray-800">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Hi! I'm your AI Financial Assistant 👋</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    I can help you understand your spending patterns, track your budgets, and provide personalized financial insights.
                  </p>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Try asking me:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickQuestions.map((question, index) => {
                        const Icon = question.icon
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            className="justify-start text-left h-auto p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => handleQuickQuestion(question.text)}
                          >
                            <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">{question.text}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-4 shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {message.role === 'assistant' ? (
                          <div className="bg-blue-600 text-white p-1.5 rounded-full">
                            <Bot className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="bg-white text-blue-600 p-1.5 rounded-full">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm whitespace-pre-wrap break-words ${
                          message.role === 'user' 
                            ? 'text-white' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {message.content}
                        </p>
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-[85%] shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 text-white p-1.5 rounded-full">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Analyzing your financial data...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible div to help with auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances... (e.g., 'How much did I spend on groceries this month?')"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading}
                className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
              <Button 
                onClick={() => sendMessage()} 
                disabled={isLoading || !input.trim()}
                className="px-4 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {messages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 w-full mb-1">Quick follow-ups:</p>
                {quickQuestions.slice(0, 3).map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => handleQuickQuestion(question.text)}
                    disabled={isLoading}
                  >
                    {question.text}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

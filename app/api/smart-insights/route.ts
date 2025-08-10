import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { financialData, userId } = await request.json()

    if (!financialData) {
      return NextResponse.json(
        { error: 'Financial data is required' },
        { status: 400 }
      )
    }

    // Create context from financial data
    const context = createFinancialContext(financialData)
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Minty AI, an advanced financial analyst that provides smart spending insights based on real user data.

FINANCIAL DATA CONTEXT:
${context}

Your task is to analyze this financial data and provide 3-5 smart insights as a JSON array. Each insight should be actionable, data-driven, and personalized.

STRICT OUTPUT FORMAT - Return ONLY valid JSON in this exact structure:
[
  {
    "type": "prediction|warning|success|goal|tip",
    "icon": "single emoji",
    "title": "Clear, specific insight title (max 80 chars)",
    "description": "Detailed explanation with specific numbers from the data (max 120 chars)",
    "actionTip": "Specific, actionable recommendation (max 150 chars)",
    "trend": "warning|success|info",
    "interactive": true,
    "category": "relevant category name if applicable"
  }
]

INSIGHT TYPES:
- "prediction": Budget overages, spending projections based on current pace
- "warning": Overspending, unusual patterns, budget concerns
- "success": Savings achievements, spending reductions, goal progress
- "goal": Progress tracking, recommendations for financial goals
- "tip": Optimization suggestions, category-specific advice

GUIDELINES:
- Use actual numbers from the provided data
- Focus on current month trends and projections
- Identify the most impactful insights
- Make recommendations specific and achievable
- Consider budget vs actual spending patterns
- Look for unusual spending patterns or opportunities
- Prioritize insights that can drive action

Return ONLY the JSON array, no additional text or formatting.`
        },
        {
          role: "user",
          content: "Generate smart financial insights based on my data."
        }
      ],
      model: "llama3-8b-8192",
      max_tokens: 1500,
      temperature: 0.3 // Lower temperature for more consistent JSON output
    })

    const response = completion.choices[0].message.content

    try {
      // Parse the AI response as JSON
      const insights = JSON.parse(response || '[]')
      
      // Validate the structure
      if (!Array.isArray(insights)) {
        throw new Error('Response is not an array')
      }

      // Ensure each insight has required fields
      const validatedInsights = insights.map((insight: any, index: number) => ({
        type: insight.type || 'tip',
        icon: insight.icon || '💡',
        title: insight.title || `Insight ${index + 1}`,
        description: insight.description || 'Analysis of your financial patterns',
        actionTip: insight.actionTip || 'Consider reviewing your spending patterns',
        trend: insight.trend || 'info',
        interactive: true,
        category: insight.category || null
      }))

      return NextResponse.json({ 
        insights: validatedInsights,
        success: true,
        modelUsed: "llama3-8b-8192"
      })

    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.log('Raw AI response:', response)
      
      // Fallback to basic insights if parsing fails
      const fallbackInsights = [
        {
          type: 'tip',
          icon: '📊',
          title: 'AI Analysis Available',
          description: 'Unable to generate detailed insights at the moment',
          actionTip: 'Try refreshing the page or add more transaction data for better analysis',
          trend: 'info',
          interactive: true,
          category: null
        }
      ]

      return NextResponse.json({ 
        insights: fallbackInsights,
        success: true,
        modelUsed: "fallback"
      })
    }

  } catch (error) {
    console.error('Smart insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart insights. Please try again.' },
      { status: 500 }
    )
  }
}

function createFinancialContext(data: any) {
  const { transactions, budgets, categories, summary } = data
  
  // Calculate additional insights
  const categorySpending = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((acc: any, t: any) => {
      // First try to find category by ID
      let category = categories.find((c: any) => c.id === t.category_id)
      
      // If not found but transaction has nested category data, use that
      if (!category && t.categories) {
        category = t.categories
      }
      
      const categoryName = category?.name || 'Uncategorized'
      acc[categoryName] = (acc[categoryName] || 0) + Math.abs(t.amount)
      return acc
    }, {})

  const recentTransactions = transactions.slice(0, 15) // Last 15 for context
  
  const currentDate = new Date()
  const currentMonth = '2025-08' // Based on your data
  
  // Filter transactions for current month (August 2025)
  const thisMonthTransactions = transactions.filter((t: any) => {
    return t.date && t.date.startsWith(currentMonth)
  })

  const thisMonthIncome = thisMonthTransactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

  const thisMonthExpenses = thisMonthTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

  // Calculate daily spending rate
  const daysIntoMonth = new Date().getDate()
  const dailySpendingRate = thisMonthExpenses / Math.max(daysIntoMonth, 1)
  
  // Calculate budget utilization
  const budgetUtilization = budgets.map((budget: any) => {
    const spent = budget.spent_amount || 0
    const limit = budget.total_amount || 0
    const utilizationRate = limit > 0 ? (spent / limit) * 100 : 0
    return {
      name: budget.name,
      spent,
      limit,
      utilizationRate,
      remaining: Math.max(0, limit - spent)
    }
  })

  return `
CURRENT FINANCIAL SNAPSHOT (August 2025):
- This Month Income: $${thisMonthIncome.toFixed(2)}
- This Month Expenses: $${thisMonthExpenses.toFixed(2)}
- This Month Net Savings: $${(thisMonthIncome - thisMonthExpenses).toFixed(2)}
- Daily Spending Rate: $${dailySpendingRate.toFixed(2)}
- Days into Month: ${daysIntoMonth}
- Projected Monthly Expenses: $${(dailySpendingRate * 31).toFixed(2)}

SPENDING BREAKDOWN (Current Month):
${Object.entries(categorySpending)
  .sort(([,a]: any, [,b]: any) => b - a)
  .slice(0, 8)
  .map(([category, amount]: any) => `- ${category}: $${amount.toFixed(2)}`)
  .join('\n')}

BUDGET ANALYSIS:
${budgetUtilization.length > 0 ? budgetUtilization.map((b: any) => 
  `- ${b.name}: $${b.spent.toFixed(2)} spent of $${b.limit.toFixed(2)} budget (${b.utilizationRate.toFixed(1)}% used, $${b.remaining.toFixed(2)} remaining)`
).join('\n') : 'No active budgets to analyze'}

RECENT TRANSACTION PATTERNS:
${recentTransactions.slice(0, 10).map((t: any) => {
  // Find category for this transaction
  let category = categories.find((c: any) => c.id === t.category_id)
  if (!category && t.categories) {
    category = t.categories
  }
  const categoryName = category?.name || 'Uncategorized'
  
  return `- ${t.date}: ${t.description} - ${t.type === 'income' ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)} (${categoryName})`
}).join('\n')}

FINANCIAL TRENDS:
- Total Transaction Count: ${transactions.length}
- Average Transaction Size: $${transactions.length > 0 ? (transactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / transactions.length).toFixed(2) : '0.00'}
- Most Active Category: ${Object.entries(categorySpending).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || 'None'}
- Largest Expense This Month: $${thisMonthTransactions.filter((t: any) => t.type === 'expense').reduce((max: number, t: any) => Math.max(max, Math.abs(t.amount)), 0).toFixed(2)}

ADDITIONAL CONTEXT:
- Analysis Date: ${currentDate.toLocaleDateString()}
- Data Coverage: ${transactions.length > 0 ? `${transactions.length} transactions` : 'Limited transaction data'}
- Categories Available: ${categories.length}
- Active Budgets: ${budgets.filter((b: any) => {
    const endDate = new Date(b.end_date)
    return endDate >= currentDate
  }).length}
`
}

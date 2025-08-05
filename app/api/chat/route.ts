import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { message, financialData, userId } = await request.json()

    if (!message || !financialData) {
      return NextResponse.json(
        { error: 'Message and financial data are required' },
        { status: 400 }
      )
    }

    // Create context from financial data
    const context = createFinancialContext(financialData)
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a personal financial assistant named "Minty AI" analyzing this user's financial data from their Minty app. 
Provide helpful, accurate insights based ONLY on the data provided below.

FINANCIAL DATA CONTEXT:
${context}

Guidelines:
- Be conversational, friendly, and helpful
- Provide specific numbers from the data when relevant
- Suggest actionable insights and recommendations
- If asked about trends, analyze the transaction history provided
- For budget questions, reference their actual budgets
- Keep responses concise but informative (2-3 paragraphs max)
- Use emojis occasionally to make responses more engaging
- If the question cannot be answered with the available data, politely explain what information would be needed
- Always end with offering to help with other financial questions

Example response format:
"Based on your financial data, I can see that... 📊

Here's what I recommend... 💡

Is there anything else about your finances you'd like me to analyze? 🤔"`
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama3-8b-8192", // Fast and free Groq model
      max_tokens: 500,
      temperature: 0.7
    })

    const response = completion.choices[0].message.content

    return NextResponse.json({ 
      response,
      success: true,
      modelUsed: "llama3-8b-8192"
    })

  } catch (error) {
    console.error('Groq API error:', error)
    return NextResponse.json(
      { error: 'Failed to get response from AI assistant. Please try again.' },
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
      const category = t.category?.name || 'Uncategorized'
      acc[category] = (acc[category] || 0) + t.amount
      return acc
    }, {})

  const recentTransactions = transactions.slice(0, 10) // Last 10 for context
  
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const thisMonthTransactions = transactions.filter((t: any) => {
    const tDate = new Date(t.date)
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
  })

  const thisMonthIncome = thisMonthTransactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const thisMonthExpenses = thisMonthTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  return `
FINANCIAL SUMMARY:
- Total Income (All Time): $${summary.totalIncome.toFixed(2)}
- Total Expenses (All Time): $${summary.totalExpenses.toFixed(2)}
- Net Amount (All Time): $${(summary.totalIncome - summary.totalExpenses).toFixed(2)}
- This Month Income: $${thisMonthIncome.toFixed(2)}
- This Month Expenses: $${thisMonthExpenses.toFixed(2)}
- This Month Net: $${(thisMonthIncome - thisMonthExpenses).toFixed(2)}
- Total Number of Transactions: ${summary.transactionCount}

SPENDING BY CATEGORY:
${Object.entries(categorySpending)
  .sort(([,a]: any, [,b]: any) => b - a)
  .slice(0, 8) // Top 8 categories
  .map(([category, amount]: any) => `- ${category}: $${amount.toFixed(2)}`)
  .join('\n')}

RECENT TRANSACTIONS (Last 10):
${recentTransactions.map((t: any) => 
  `- ${new Date(t.date).toLocaleDateString()}: ${t.description} - ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)} (${t.category?.name || 'Uncategorized'})`
).join('\n')}

ACTIVE BUDGETS:
${budgets.length > 0 ? budgets.map((b: any) => {
  const startDate = new Date(b.start_date)
  const endDate = new Date(b.end_date)
  const isActive = currentDate >= startDate && currentDate <= endDate
  return `- ${b.name}: $${b.total_amount.toFixed(2)} (${b.type}) - ${isActive ? 'ACTIVE' : 'INACTIVE'} (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`
}).join('\n') : 'No budgets set up yet.'}

CATEGORIES AVAILABLE:
${categories.map((c: any) => 
  `- ${c.name} (${c.type})`
).join('\n')}

ADDITIONAL CONTEXT:
- Current Date: ${currentDate.toLocaleDateString()}
- Data includes transactions from ${transactions.length > 0 ? new Date(transactions[transactions.length - 1].date).toLocaleDateString() : 'N/A'} to ${transactions.length > 0 ? new Date(transactions[0].date).toLocaleDateString() : 'N/A'}
`
}

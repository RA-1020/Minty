export interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  allowClickthrough?: boolean
  page?: string
  navigateTo?: string
  showOnPage?: string
  onNext?: () => void
}

export const MAIN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🎉 Welcome to Minty!',
    description: 'Your personal finance dashboard that makes money management simple and intuitive. Let\'s take a quick interactive tour to get you started with real data!',
    placement: 'center',
    allowClickthrough: false
  },
  {
    id: 'navigation-overview',
    title: '🧭 Navigation Made Simple',
    description: 'This sidebar is your command center. From here, you can access all of Minty\'s features - dashboard, budgets, transactions, categories, and more.',
    target: 'sidebar',
    placement: 'right',
    allowClickthrough: false
  },
  {
    id: 'categories-navigation',
    title: '📂 Let\'s Start with Categories',
    description: 'Categories help you organize your spending. Click here to go to the Categories page where we\'ll create your first category together.',
    target: 'categories-link',
    placement: 'right',
    allowClickthrough: true,
    navigateTo: 'categories'
  },
  {
    id: 'categories-overview',
    title: '📂 Categories Overview',
    description: 'Categories are your financial foundation. They organize your spending (groceries, entertainment) and connect directly to your budgets and transactions for complete money tracking.',
    placement: 'center',
    allowClickthrough: false,
    showOnPage: 'categories'
  },
  {
    id: 'create-first-category',
    title: '✨ Interactive Tutorial: Create Your First Category',
    description: 'Let\'s create a category together! Click "Create Category" to add your first spending category. Try "Groceries" or any category that fits your lifestyle - these are just suggestions!',
    target: 'create-category',
    placement: 'bottom',
    allowClickthrough: true,
    showOnPage: 'categories'
  },
  {
    id: 'budgets-navigation',
    title: '💰 Now Let\'s Set Up Budgets',
    description: 'Perfect! Your category connects to budgets. Set spending limits per category (like $200/month for groceries) and track your progress automatically.',
    target: 'budgets-link',
    placement: 'right',
    allowClickthrough: true,
    navigateTo: 'budgets'
  },
  {
    id: 'budgets-overview',
    title: '💰 Budgets Overview',
    description: 'Budgets work with your categories to control spending. Each budget links to a category and tracks your actual spending against your set limits.',
    placement: 'center',
    allowClickthrough: false,
    showOnPage: 'budgets'
  },
  {
    id: 'create-first-budget',
    title: '✨ Interactive Tutorial: Create Your First Budget',
    description: 'Now let\'s create a budget! Click "Create Budget" to set up your first spending limit. Try setting a monthly budget for your grocery category.',
    target: 'create-budget',
    placement: 'bottom',
    allowClickthrough: true,
    showOnPage: 'budgets'
  },
  {
    id: 'transactions-navigation',
    title: '📝 Time for Transactions',
    description: 'Excellent! Now transactions complete the connection. Each transaction links to your categories and automatically updates your budget progress in real-time.',
    target: 'transactions-link',
    placement: 'right',
    allowClickthrough: true,
    navigateTo: 'transactions'
  },
  {
    id: 'transactions-overview',
    title: '📝 Transactions Overview',
    description: 'Transactions bring everything together: each purchase gets assigned to a category, deducts from your budget, and flows into your dashboard analytics automatically.',
    placement: 'center',
    allowClickthrough: false,
    showOnPage: 'transactions'
  },
  {
    id: 'add-first-transaction',
    title: '✨ Interactive Tutorial: Add Your First Transaction',
    description: 'Perfect! Add a transaction and watch the magic: choose your grocery category → it deducts from your grocery budget → updates your dashboard instantly. This is the connection in action!',
    target: 'add-transaction',
    placement: 'bottom',
    allowClickthrough: true,
    showOnPage: 'transactions'
  },
  {
    id: 'dashboard-navigation',
    title: '📊 See It All Come Together',
    description: 'Amazing! Now see the complete flow: your transaction → category → budget → dashboard. Everything connects automatically for real-time financial insights.',
    target: 'dashboard-link',
    placement: 'right',
    allowClickthrough: true,
    navigateTo: 'dashboard'
  },
  {
    id: 'smart-insights',
    title: '🧠 AI-Powered Smart Insights',
    description: 'These AI insights analyze your spending patterns and provide personalized recommendations. They update automatically as you add more transactions.',
    target: 'smart-insights',
    placement: 'bottom',
    showOnPage: 'dashboard'
  },
  {
    id: 'charts-overview',
    title: '📈 Visual Financial Overview',
    description: 'These charts show your financial data at a glance. Notice how your transaction automatically appears in the visualizations - this is the "ripple effect" in action!',
    target: 'charts',
    placement: 'top',
    showOnPage: 'dashboard'
  },
  {
    id: 'spending-chart',
    title: '🥧 Spending Breakdown',
    description: 'This pie chart breaks down your spending by category. See how your grocery transaction now appears here? Everything in Minty is connected and updates automatically.',
    target: 'spending-chart',
    placement: 'left',
    showOnPage: 'dashboard'
  },
  {
    id: 'recent-transactions',
    title: '📋 Recent Activity',
    description: 'Your latest transactions appear here. Notice how the transaction you just added shows up? This real-time updating helps you stay on top of your finances.',
    target: 'recent-transactions',
    placement: 'left',
    showOnPage: 'dashboard'
  },
  {
    id: 'budget-alerts',
    title: '⚠️ Budget Alerts',
    description: 'This section shows when you\'re approaching or exceeding your budget limits. It helps you stay aware of your spending and make adjustments before overspending.',
    target: 'budget-alerts',
    placement: 'right',
    showOnPage: 'dashboard'
  },
  {
    id: 'financial-metrics',
    title: '📊 Key Financial Metrics',
    description: 'These cards show your essential financial data. Watch how they update as you add more transactions. You\'re all set to manage your finances with Minty!',
    target: 'metrics',
    placement: 'right',
    showOnPage: 'dashboard'
  },
  {
    id: 'completion',
    title: '🎊 Congratulations!',
    description: 'You\'ve completed the Minty tutorial! You now have categories, budgets, and transactions set up. Feel free to explore, add more data, and make Minty work for your financial goals.',
    placement: 'center',
    allowClickthrough: false,
    showOnPage: 'dashboard'
  }
]

export const CATEGORY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'category-welcome',
    title: '🏷️ Category Management',
    description: 'Here you can create and manage your spending categories. Categories help organize your transactions and budgets for better financial tracking.',
    placement: 'center'
  }
]

export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'dashboard-welcome',
    title: '📊 Dashboard Overview', 
    description: 'Your financial dashboard shows all your key metrics, recent transactions, and spending insights in one comprehensive view.',
    placement: 'center'
  }
]

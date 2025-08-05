export class NotificationService {
  private static instance: NotificationService;
  private hasPermission: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.requestPermission();
    }
  }

  public static getInstance(): NotificationService {
    if (typeof window === 'undefined') {
      return {} as NotificationService; // Return empty object during SSR
    }
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async requestPermission() {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === "granted";
  }

  public async sendBrowserNotification(title: string, options: NotificationOptions = {}) {
    if (!this.hasPermission) {
      await this.requestPermission();
    }

    if (this.hasPermission) {
      return new Notification(title, options);
    }
  }

  public async sendBudgetAlert(budget: { name: string; spent: number; limit: number }) {
    const percentageSpent = (budget.spent / budget.limit) * 100;
    if (percentageSpent >= 80) {
      await this.sendBrowserNotification(
        "Budget Alert",
        {
          body: `You've used ${percentageSpent.toFixed(0)}% of your ${budget.name} budget`,
          icon: "/placeholder-logo.png",
          tag: `budget-${budget.name}`,
        }
      );
    }
  }

  public async sendTransactionReminder() {
    const now = new Date();
    const daysSinceLastTransaction = 3; // This should be calculated based on actual last transaction

    if (daysSinceLastTransaction >= 3) {
      await this.sendBrowserNotification(
        "Transaction Reminder",
        {
          body: "Don't forget to log your recent transactions!",
          icon: "/placeholder-logo.png",
          tag: "transaction-reminder",
        }
      );
    }
  }

  public async sendWeeklyReport(data: { 
    totalSpent: number;
    topCategory: string;
    comparedToLastWeek: number;
  }) {
    await this.sendBrowserNotification(
      "Weekly Spending Summary",
      {
        body: `You spent $${data.totalSpent} this week. Top category: ${data.topCategory}. ${
          data.comparedToLastWeek > 0 
            ? `That's ${data.comparedToLastWeek}% more than last week.`
            : `That's ${Math.abs(data.comparedToLastWeek)}% less than last week.`
        }`,
        icon: "/placeholder-logo.png",
        tag: "weekly-report",
      }
    );
  }

  public async sendMonthlyReport(data: {
    totalSpent: number;
    savedAmount: number;
    topCategories: string[];
  }) {
    await this.sendBrowserNotification(
      "Monthly Financial Overview",
      {
        body: `Monthly Summary:
        Total Spent: $${data.totalSpent}
        Saved: $${data.savedAmount}
        Top Categories: ${data.topCategories.join(", ")}`,
        icon: "/placeholder-logo.png",
        tag: "monthly-report",
      }
    );
  }
}

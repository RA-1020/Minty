import { NotificationService } from './notification-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export class NotificationManager {
  private notificationService: NotificationService;
  private userId: string | null = null;

  constructor() {
    this.notificationService = NotificationService.getInstance();
    this.initializeUser();
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  private async getUserPreferences() {
    if (!this.userId) return null;

    const { data, error } = await supabase
      .from('notification_settings')
      .select('preferences')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data?.preferences;
  }

  public async checkAndNotifyBudget(budgetData: {
    name: string;
    spent: number;
    limit: number;
  }) {
    const preferences = await this.getUserPreferences();
    if (preferences?.budgetAlerts) {
      await this.notificationService.sendBudgetAlert(budgetData);
    }
  }

  public async checkAndSendTransactionReminder() {
    const preferences = await this.getUserPreferences();
    if (preferences?.transactionReminders) {
      await this.notificationService.sendTransactionReminder();
    }
  }

  public async sendWeeklyReportIfEnabled(reportData: {
    totalSpent: number;
    topCategory: string;
    comparedToLastWeek: number;
  }) {
    const preferences = await this.getUserPreferences();
    if (preferences?.weeklyReports) {
      await this.notificationService.sendWeeklyReport(reportData);
    }
  }

  public async sendMonthlyReportIfEnabled(reportData: {
    totalSpent: number;
    savedAmount: number;
    topCategories: string[];
  }) {
    const preferences = await this.getUserPreferences();
    if (preferences?.monthlyReports) {
      await this.notificationService.sendMonthlyReport(reportData);
    }
  }

  // Helper method to check if notifications are supported
  public static isSupported(): boolean {
    return "Notification" in window;
  }
}

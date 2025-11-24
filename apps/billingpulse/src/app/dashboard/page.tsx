"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Users,
  XCircle,
} from "lucide-react";

// Mock data for demo
const mockMetrics = {
  mrr: 24500,
  mrrChange: 8.2,
  activeCustomers: 145,
  customersChange: 3,
  failedPayments: 12,
  failedAmount: 1840,
  recoveredAmount: 650,
  recoveryRate: 35.3,
};

const mockFailedPayments = [
  {
    id: "pay_1",
    customer: "john@example.com",
    amount: 149,
    declineCode: "insufficient_funds",
    date: "2024-11-24T10:30:00Z",
    retryScheduled: "2024-11-27T10:30:00Z",
    attempts: 1,
  },
  {
    id: "pay_2",
    customer: "sarah@startup.io",
    amount: 299,
    declineCode: "card_declined",
    date: "2024-11-24T08:15:00Z",
    retryScheduled: "2024-11-25T08:15:00Z",
    attempts: 2,
  },
  {
    id: "pay_3",
    customer: "mike@agency.com",
    amount: 499,
    declineCode: "expired_card",
    date: "2024-11-23T16:45:00Z",
    retryScheduled: null,
    attempts: 3,
  },
];

const declineCodeDescriptions: Record<string, string> = {
  insufficient_funds: "Customer's card has insufficient funds",
  card_declined: "Card was declined by the issuing bank",
  expired_card: "The card has expired",
  processing_error: "A processing error occurred",
  incorrect_cvc: "The CVC number is incorrect",
};

export default function DashboardPage() {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <CreditCard className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Connect Your Stripe Account</h1>
            <p className="text-gray-600 mb-8">
              Connect your Stripe account to start analyzing your billing data and recovering
              failed payments automatically.
            </p>
            <button
              onClick={() => setIsConnected(true)}
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition"
            >
              Connect Stripe
            </button>
            <p className="text-sm text-gray-500 mt-4">
              We only request read access to your payment data
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Monthly Recurring Revenue"
            value={`$${mockMetrics.mrr.toLocaleString()}`}
            change={mockMetrics.mrrChange}
            icon={DollarSign}
            positive
          />
          <MetricCard
            title="Active Customers"
            value={mockMetrics.activeCustomers.toString()}
            change={mockMetrics.customersChange}
            icon={Users}
            positive
          />
          <MetricCard
            title="Failed Payments (30d)"
            value={mockMetrics.failedPayments.toString()}
            subValue={`$${mockMetrics.failedAmount.toLocaleString()} at risk`}
            icon={XCircle}
            negative
          />
          <MetricCard
            title="Recovered This Month"
            value={`$${mockMetrics.recoveredAmount}`}
            subValue={`${mockMetrics.recoveryRate}% recovery rate`}
            icon={RefreshCw}
            positive
          />
        </div>

        {/* Failed Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Failed Payments</h2>
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Decline Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retry Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockFailedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.customer}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        ${payment.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {payment.declineCode.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {declineCodeDescriptions[payment.declineCode]}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.retryScheduled ? (
                        <div>
                          <span className="text-sm text-green-600 font-medium">
                            Scheduled
                          </span>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.retryScheduled).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Max attempts reached
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Retry Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({ user }: { user: any }) {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-8 w-8 text-green-600" />
          <span className="text-xl font-bold">BillingPulse</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user?.firstName || "User"}</span>
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 font-medium">
              {user?.firstName?.[0] || "U"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  title,
  value,
  change,
  subValue,
  icon: Icon,
  positive,
  negative,
}: {
  title: string;
  value: string;
  change?: number;
  subValue?: string;
  icon: any;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <Icon
          className={`h-5 w-5 ${
            positive ? "text-green-600" : negative ? "text-red-500" : "text-gray-400"
          }`}
        />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center ${
              change >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

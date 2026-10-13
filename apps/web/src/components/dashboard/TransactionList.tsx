'use client'

import { FileSearch, Minus, Plus } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
  emptyMessage?: string
}

export function TransactionList({ transactions, isLoading = false, emptyMessage = 'No transactions yet.' }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5" />
              <div className="space-y-2">
                <div className="h-3.5 w-40 rounded bg-white/5" />
                <div className="h-3 w-24 rounded bg-white/5" />
              </div>
            </div>
            <div className="h-5 w-16 rounded bg-white/5 ml-4" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileSearch size={20} className="text-gray-500" />
        </div>
        <p className="text-gray-500 text-sm max-w-xs">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const isDebit = tx.type === 'debit'
        const isCredit = tx.type === 'credit'
        return (
          <div
            key={tx.id}
            className={cn(
              'flex items-center justify-between p-4 rounded-xl border transition-colors',
              'bg-white/3 border-white/5 hover:bg-white/5'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {isDebit ? <Minus size={16} className="text-rose-400" /> : isCredit ? <Plus size={16} className="text-emerald-400" /> : <FileSearch size={16} className="text-gray-500" />}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                  {formatDate(tx.transactionDate)}
                  {tx.currency !== 'NGN' ? <span className="text-gray-600"> · {tx.currency}</span> : null}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className={cn('text-sm font-semibold', isDebit ? 'text-rose-400' : isCredit ? 'text-emerald-400' : 'text-white')}>
                {formatCurrency(tx.amount, tx.currency as 'NGN' | 'USD' | 'GBP')}
              </p>
              <p className="text-gray-500 text-xs mt-0.5 capitalize">{tx.type}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

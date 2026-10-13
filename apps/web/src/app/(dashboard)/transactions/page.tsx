'use client'

import { useState } from 'react'
import { FileSearch, Trash2, RefreshCw, Download } from 'lucide-react'
import { useTransactions } from '@/hooks/useQorvi'
import { TransactionList } from '@/components/dashboard/TransactionList'
import { useConfirmImport } from '@/hooks/useQorvi'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

const PAGE_SIZE = 50

export default function TransactionsPage() {
  const { transactions, total, isLoading, error, refetch } = useTransactions(PAGE_SIZE)
  const [page, setPage] = useState(0)
  const [paginated, setPaginated] = useState<Transaction[]>(transactions)

  const confirmImport = useConfirmImport()

  const visible = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 mt-1">
            Parsed transaction rows from your imported CSV files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()} isLoading={isLoading}>
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button variant="destructive" onClick={async () => {
            if (!confirm('Delete all transactions for this account? This cannot be undone.')) return
            await refetch()
          }}>
            <Trash2 size={16} />
            Clear all
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <FileSearch size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction list</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && visible.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={20} className="animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              <TransactionList
                transactions={visible}
                isLoading={false}
                emptyMessage="No transactions yet. Import a CSV to see them here."
              />
              {total > visible.length && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <p className="text-gray-500 text-sm">
                    Showing {visible.length} of {total} transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-gray-500 text-sm">Page {page + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={(page + 1) * PAGE_SIZE >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useMapTransaction, useTransactions } from '@/hooks/store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import TableTranction from './tables/Table'

import Navbar from './Navbar'

import { TypeMapTransaction } from '@/type/store/typeStore'
import {
  bill,
  foodKeywords,
  investmentKeywords,
  navbars,
} from '@/utils/constant'

import DetailsSection from './DetailsSection'
import AmountDateChart from './charts/AmountDateChart'
import { FullNavbarType, NavbarType } from '@/type'
import FinanceBoxes from './FinanceBoxes'
import Empty from './Empty'
import FilterBar from './FiltereBar'
import { table } from 'console'
import { Select } from '@react-three/drei'

export default function TransactionsList() {
  const { data } = useTransactions()
  const [select, setSelect] = useState<FullNavbarType>('details')
  const [totalInvestmentAmount, setTotalInvestmentAmount] = useState<number>(0)
  const [totalCreditedAmount, setTotalCreditedAmount] = useState<number>(0)
  const [totalDebitedAmount, setTotalDebittedAmount] = useState<number>(0)

  const [sortCriteria, setSortCriteria] = useState<'count' | 'amount'>('amount')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { dataMap, setDataMap } = useMapTransaction()

  const { transactions, currency } = data

  useEffect(() => {
    if (!transactions.length) {
      console.warn('No transactions found')
      return
    }

    const map: TypeMapTransaction = Object.fromEntries(
      navbars.slice(1).map((key) => [key, {}])
    ) as TypeMapTransaction

    let totalInvestment = 0

    let totalCredit = 0
    let totalDebit = 0

    transactions.forEach(({ description, amount, type, tableName }) => {
      // normalization of description
      description = description.startsWith('UPI')
        ? description.split('@')[0].split('-')[1]
        : description.split('@')[0]

      const mapKey = tableName as NavbarType
      if (!map[mapKey]) return

      const numericAmount = parseFloat(amount)
      if (isNaN(numericAmount)) {
        // console.warn(mapKey, description, amount)
        if (map[mapKey][description]) {
          map[mapKey][description].totalAmount += numericAmount
          map[mapKey][description].count += 1
        } else {
          map[mapKey][description] = { totalAmount: numericAmount, count: 1 }
        }
        console.warn('amount is not a number', numericAmount)
        return
      }

      // Update totals based on type
      if (tableName === 'investment' && type === 'debit') {
        totalInvestment += numericAmount
      } else if (type === 'credit') {
        totalCredit += numericAmount
      } else if (type === 'debit') {
        totalDebit += numericAmount
      }

      // Use tableName dynamically for mapping

      if (map[mapKey][description]) {
        map[mapKey][description].totalAmount += numericAmount
        map[mapKey][description].count += 1
      } else {
        map[mapKey][description] = { totalAmount: numericAmount, count: 1 }
      }
    })

    setTotalCreditedAmount(totalCredit)
    setTotalDebittedAmount(totalDebit)
    setTotalInvestmentAmount(totalInvestment)

    setDataMap(map)
  }, [transactions])

  // sorting the data => the array which will be used to render the table
  const sortedData = useMemo(() => {
    if (!dataMap[select as NavbarType]) return []

    return Object.entries(dataMap[select as NavbarType]).sort(
      ([, dataA], [, dataB]) => {
        console.log(dataA, dataB)
        const valueA =
          sortCriteria === 'count' ? dataA.count : dataA.totalAmount
        const valueB =
          sortCriteria === 'count' ? dataB.count : dataB.totalAmount

        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
      }
    )
  }, [dataMap, select, sortCriteria, sortOrder])

  // console.log(dataMap, sortedData)

  const chartData = useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      const { date, amount, type } = transaction
      const existingEntry = acc.find((entry) => entry.date === date)

      if (existingEntry) {
        if (type === 'credit') {
          existingEntry.creditAmount += parseFloat(amount)
        } else if (type === 'debit') {
          existingEntry.debitAmount += parseFloat(amount)
        }
      } else {
        acc.push({
          date,
          creditAmount: type === 'credit' ? parseFloat(amount) : 0,
          debitAmount: type === 'debit' ? parseFloat(amount) : 0,
        })
      }

      return acc
    }, [] as { date: string; creditAmount: number; debitAmount: number }[])
  }, [transactions])

  if (!transactions.length) {
    // dont show html if no transactions
    console.warn('No transactions found')
    return
  }
  const perTableAmount = sortedData.reduce(
    (sum, [, entry]) => sum + entry.totalAmount,
    0
  )

  return (
    <div className="my-8  font-sans  border-black/[0.5]">
      <Navbar select={select} setSelect={setSelect} />

      <div className="flex flex-col-reverse gap-2 md:flex-col">
        <FinanceBoxes
          totalCreditedAmount={totalCreditedAmount}
          totalDebitedAmount={totalDebitedAmount}
          totalInvestmentAmount={totalInvestmentAmount}
        />
        {select == 'details' ? (
          <DetailsSection
            totalCreditedAmount={totalCreditedAmount}
            totalDebitedAmount={totalDebitedAmount}
            totalInvestmentAmount={totalInvestmentAmount}
            chartData={chartData}
          />
        ) : dataMap && sortedData?.length == 0 ? (
          <Empty select={select} />
        ) : (
          <>
            <FilterBar
              setSortCriteria={setSortCriteria}
              sortCriteria={sortCriteria}
              setSortOrder={setSortOrder}
              sortOrder={sortOrder}
              perTableAmount={perTableAmount}
            />

            <div
              id="table"
              className=" h-auto  max-h-[580px] relative overflow-auto overflow-x-auto md:overflow-x-hidden shadow-sm drop-shadow-sm  bg-black/5  rounded-md border border-white/10 backdrop-blur-lg"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Transaction Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-hidden ">
                  {sortedData.map(([description, { totalAmount, count }]) => (
                    <TableTranction
                      key={`${select}-${description}`}
                      type={select}
                      totalAmount={totalAmount}
                      description={description}
                      count={count}
                      currency={currency}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

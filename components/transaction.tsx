"use client";

import { useEffect, useState } from "react";
import { useMapTransaction, useTransactions } from "@/hooks/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableTranction from "./tables/Table";
import { describe } from "node:test";
import Navbar from "./Navbar";
import DetailedTable from "./tables/DetailedTable";
import { TypeMapTransaction } from "@/type/store/typeStore";
import { bill, foodKeywords, investmentKeywords } from "@/utils/constant";
import {
  FuturisticHighIncomeIndicator,
  FuturisticLowIncomeIndicator,
} from "./arrow/Arrow";
import Image from "next/image";
import InvestmentChart from "./InvestmentChart";
import InvestmentDoughnutChart from "./InvestmentChart";
import InvestmentCard from "./InvestmentChart";

export default function TransactionsList() {
  const { data } = useTransactions();
  const [select, setSelect] = useState<string>("details");
  const [totalInvestmentAmount, setTotalInvestmentAmount] = useState<number>(0);
  const [totalCreditedAmount, setTotalCreditedAmount] = useState<number>(0);
  const [totalDebitedAmount, setTotalDebittedAmount] = useState<number>(0);

  const { dataMap, setDataMap } = useMapTransaction();

  const { transactions, currency, months } = data;

  useEffect(() => {
    if (!transactions.length) return;

    const map: TypeMapTransaction = {
      credit: {},
      debit: {},
      investment: {},
      food: {},
      bill: {},
    };

    let totalInvestment = 0;

    let totalCredit = 0;
    let totalDebit = 0;

    transactions.forEach((transaction) => {
      let { description, amount, type } = transaction;

      description = description.startsWith("UPI")
        ? description.split("@")[0].split("-")[1]
        : description.split("@")[0];

      // Check if the transaction matches any investment keyword
      const isInvestment = investmentKeywords.some((keyword) =>
        description.toUpperCase().includes(keyword),
      );

      const isFood = foodKeywords.some((keyword) => {
        return description.toUpperCase().includes(keyword.toUpperCase());
      });
      const isBill = bill.some((keyword) =>
        description.toUpperCase().includes(keyword.toUpperCase()),
      );
      if (!isNaN(+amount)) {
        if (isInvestment && type === "debit") {
          console.log(+amount, description);
          totalInvestment += parseFloat(amount);
        } else {
          // console.log(parseFloat(amount), description);
          if (type === "credit") totalCredit += parseFloat(amount);
          else if (type === "debit") totalDebit += parseFloat(amount);
        }
      }

      if (isBill) {
        if (map.bill[description]) {
          map.bill[description].totalAmount += +amount;
          map.bill[description].count += 1;
        } else {
          map.bill[description] = { totalAmount: +amount, count: 1 };
        }
      } else if (isFood) {
        if (map.food[description]) {
          map.food[description].totalAmount += +amount;
          map.food[description].count += 1;
        } else {
          map.food[description] = { totalAmount: +amount, count: 1 };
        }
      } else if (isInvestment) {
        if (map.investment[description]) {
          map.investment[description].totalAmount += +amount;
          map.investment[description].count += 1;
        } else {
          map.investment[description] = { totalAmount: +amount, count: 1 };
        }
      } else {
        // Add to either credit or debit
        if (map[type][description]) {
          map[type][description].totalAmount += +amount;
          map[type][description].count += 1;
        } else {
          // Miscellaneous
          map[type][description] = { totalAmount: +amount, count: 1 };
        }
      }
    });

    setTotalCreditedAmount(totalCredit);
    setTotalDebittedAmount(totalDebit);
    setTotalInvestmentAmount(totalInvestment);

    setDataMap(map);
  }, [transactions]);

  if (!transactions.length) return null;

  return (
    <div className="mt-8 font-sans">
      <Navbar select={select} setSelect={setSelect} />

      {/* <h2 className="text-2xl font-semibold mb-4">
        Extracted Transactions for {months.length}   months{" "}
      </h2>
      <div className="border rounded-lg bg-[#fdfdfdcc] max-h-[700px] p-1 overflow-auto shadow-sm drop-shadow-sm">
        <DetailedTable transactions={transactions} currency={currency} />
      </div> */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-[#509E9017] rounded-lg">
          <div className="text-2xl font-bold text-[#509E90] ">
            {totalCreditedAmount}
          </div>
          <div className="text-sm text-gray-600">Total Credited Amount</div>
        </div>
        <div className="text-center p-4 bg-[#E76E5017] rounded-lg">
          <div className="text-2xl font-bold text-[#E76E50]">
            {totalDebitedAmount}
          </div>
          <div className="text-sm text-gray-600">
            Total Non-Investment Amount
          </div>
        </div>
        <div className="text-center p-4 bg-[#509E9017] rounded-lg">
          <div className="text-2xl font-bold text-[#509E90] ">
            {totalInvestmentAmount}
          </div>
          <div className="text-sm text-gray-600">Total Investment</div>
        </div>
      </div>
      {select == "details" ? (
        <div className="flex flex-col text-sm font-medium divide-y border rounded-sm">
          <div className="text-center w-full py-5 flex xl:flex-row flex-col justify-center items-center">
            <div className="flex  lg:flex-row  w-[90%]  text-center py-5 pl-4 justify-center items-center">
              Total Savings Amount :{" "}
              <div className="flex justify-center items-center">
                <span
                  className={`text-center mx-3 px-10 py-1 h-fit border rounded-md`}
                >
                  {(totalCreditedAmount - totalDebitedAmount).toFixed(2)}
                </span>
                {totalCreditedAmount - totalDebitedAmount > 0 ? (
                  <FuturisticHighIncomeIndicator />
                ) : (
                  <FuturisticLowIncomeIndicator />
                )}
              </div>
            </div>
            <InvestmentCard
              invest={totalInvestmentAmount}
              nonInvest={totalDebitedAmount}
            />
          </div>

          <div className="flex flex-col divide-y">
            <p className="px-3 py-5">
              {totalCreditedAmount - totalDebitedAmount > 0 ? (
                <>
                  To meet the 50/30/20 rule: Reduce non-investment debits to
                  less than {(0.8 * totalCreditedAmount).toFixed(2)} (Reduce by{" "}
                  {Math.abs(
                    80 -
                      +(
                        (totalDebitedAmount / totalCreditedAmount) *
                        100
                      ).toFixed(2),
                  )}
                  %).
                </>
              ) : (
                <>
                  You have overspent, and your non-investment debits exceed the
                  credited amount. Consider reducing your expenses to less than{" "}
                  {(0.8 * totalCreditedAmount).toFixed(2)}.
                </>
              )}
            </p>
            <p className="px-3 py-5">
              To meet the 50/30/20 rule: Reduce non-investment debits to less
              than {(0.8 * totalCreditedAmount).toFixed(2)} ( Reduce by{" "}
              {+((totalDebitedAmount / totalCreditedAmount) * 100).toFixed(2) -
                80}
              % )
            </p>

            <div className="px-3 py-5">
              <span>
                The debit amount (excluding investment) is{" "}
                {((totalDebitedAmount / totalCreditedAmount) * 100).toFixed(2)}%
                of the total credited amount, which is{" "}
                {+((totalDebitedAmount / totalCreditedAmount) * 100).toFixed(
                  2,
                ) > 80
                  ? "higher than the 80% threshold."
                  : "within the acceptable threshold."}
              </span>
            </div>

            <div className="w-full p-5">
              <span className="block font-semibold mb-2">
                Expected Allocations:
              </span>
              <div className="border rounded-sm overflow-auto flex w-full divide-x-2 ">
                <div className=" basis-2/3 divide-y-2 ">
                  <div className="flex divide-x-2  w-full  items-center">
                    <div className="flex w-[55%] flex-col ">
                      <p className="p-3 flex justify-between ">
                        <span className="font-medium">50% Essentials</span>
                        <span className="">:</span>
                        {(0.5 * totalCreditedAmount).toFixed(2)}
                      </p>
                      <p className="p-3 flex justify-between">
                        <span className="font-medium">30% Lifestyle</span>
                        <span className="">:</span>
                        {(0.3 * totalCreditedAmount).toFixed(2)}
                      </p>
                    </div>
                    <p className="flex  justify-between basis-1/2  py-10 h-full   px-5">
                      <p className="font-medium h-full pr-3 ">50% + 30%</p>
                      <span>:</span>
                      <span>
                        {(
                          0.5 * totalCreditedAmount +
                          0.3 * totalCreditedAmount
                        ).toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className=" w-full h-[38%] flex justify-center items-center">
                    <div className="flex justify-between w-1/2">
                      <span className="font-medium">20% Investments</span>{" "}
                      <span className="">:</span>
                      {(0.2 * totalCreditedAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
                <p className=" text-start flex justify-between basis-1/3 py-[4.5rem] px-5 h-full">
                  <p className="font-medium h-full">50% + 30% + 20%</p>
                  <span>: </span>
                  {totalCreditedAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : dataMap &&
        Object.entries(dataMap[select as "credit" | "debit" | "investment"])
          .length === 0 ? (
        <div className="w-full h-full py-10 text-[#b0b0b0] flex-col flex justify-center items-center">
          <Image src="empty.svg" alt="empty" width={500} height={500} />
        </div>
      ) : (
        <div className="border rounded-lg bg-[#fdfdfdcc] h-auto max-h-[700px] overflow-auto shadow-sm drop-shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Transaction Count</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(
                dataMap[select as "credit" | "debit" | "investment"],
              ).map(([description, { totalAmount, count }]) => (
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
      )}
    </div>
  );
}

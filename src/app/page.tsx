"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { suggestCategory } from "@/ai/flows/suggest-category";
import { Skeleton } from "@/components/ui/skeleton";

const ExpenseColor = "text-red-500";
const IncomeColor = "text-green-500";

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
}

const defaultEntries: LedgerEntry[] = [
  {
    id: "1",
    date: "2024-08-01",
    description: "Salary",
    category: "Income",
    amount: 5000,
    type: "income",
  },
  {
    id: "2",
    date: "2024-08-15",
    description: "Rent",
    category: "Housing",
    amount: 2000,
    type: "expense",
  },
  {
    id: "3",
    date: "2024-08-15",
    description: "Groceries",
    category: "Food",
    amount: 500,
    type: "expense",
  },
  {
    id: "4",
    date: "2024-08-01",
    description: "Dividends",
    category: "Investment",
    amount: 7000,
    type: "income",
  },
];

export default function Home() {
  const [entries, setEntries] = useState<LedgerEntry[]>(defaultEntries);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categorySuggestion, setCategorySuggestion] = useState<string | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  useEffect(() => {
    const getCategorySuggestion = async () => {
      if (description.length === 0) {
        setCategorySuggestion(null);
        return;
      }

      setIsLoadingCategory(true);

      try {
        const suggestion = await suggestCategory({ description });
        setCategorySuggestion(suggestion.category);
      } catch (error) {
        console.error("Failed to suggest category:", error);
        setCategorySuggestion("Error suggesting category");
      } finally {
        setIsLoadingCategory(false);
      }
    };

    getCategorySuggestion();
  }, [description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !category || amount === null) {
      alert("Please fill in all fields");
      return;
    }

    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      date,
      description,
      category,
      amount,
      type,
    };

    setEntries([...entries, newEntry]);
    setDate("");
    setDescription("");
    setCategory("");
    setAmount(null);
  };

  const totalIncome = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LedgerLite</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Entry</CardTitle>
            <CardDescription>Enter income or expense details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  {isLoadingCategory ? (
                    <Skeleton className="w-24 h-10" />
                  ) : categorySuggestion ? (
                    <Badge className="mt-1">{categorySuggestion}</Badge>
                  ) : null}
                </div>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  type="number"
                  id="amount"
                  value={amount === null ? "" : amount.toString()}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select id="type" value={type} onChange={(e) => setType(e.target.value as "income" | "expense")}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <Button type="submit">Add Entry</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ledger</CardTitle>
            <CardDescription>View ledger entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of your recent expenses.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.date}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell className={cn("text-right font-medium", entry.type === "income" ? IncomeColor : ExpenseColor)}>
                      {entry.type === "income" ? "+" : "-"}${entry.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent className="text-green-500">${totalIncome}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-red-500">${totalExpenses}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>${balance}</CardContent>
        </Card>
      </div>
      </div>
  );
}

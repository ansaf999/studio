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
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";

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

export default function Home() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
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

  useEffect(() => {
    if (!date) return;

    const formattedDate = format(date, 'yyyy-MM-dd');

    const entriesCollection = collection(db, "entries");

    const unsubscribe = onSnapshot(entriesCollection, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        amount: parseFloat(doc.data().amount),
      }))
        .filter(entry => entry.date === formattedDate)
        .sort((a, b) => a.date.localeCompare(b.date)) as LedgerEntry[];
      setEntries(fetchedEntries);
    });

    return () => unsubscribe();
  }, [date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !category || amount === null) {
      alert("Please fill in all fields");
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');

    try {
      const entriesCollection = collection(db, "entries");
      await addDoc(entriesCollection, {
        date: formattedDate,
        description,
        category,
        amount,
        type,
      });

      setDate(undefined);
      setDescription("");
      setCategory("");
      setAmount(null);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const entryDoc = doc(db, "entries", id);
      await deleteDoc(entryDoc);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                        Delete
                      </Button>
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


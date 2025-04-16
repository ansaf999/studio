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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
}

export default function Home() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [categorySuggestion, setCategorySuggestion] = useState<string | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [ledgerDate, setLedgerDate] = useState<Date | undefined>(new Date());


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
    if (!ledgerDate) return;

    const formattedDate = format(ledgerDate, 'yyyy-MM-dd');

    const entriesCollection = collection(db, "entries");

    const unsubscribe = onSnapshot(entriesCollection, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        amount: parseFloat(doc.data().amount),
      }))
        .filter(entry => entry.date === formattedDate)
        .sort((a, b) => a.date.localeCompare(b.date));
      setEntries(fetchedEntries);
    });

    return () => unsubscribe();
  }, [ledgerDate]);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    setDescription("");
    setCategory("");
    setAmount(null);
  };

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


  const totalIncome = entries.filter((entry) => entry.category === "Income").reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = entries.filter((entry) => entry.category === "Expense").reduce((sum, entry) => sum + entry.amount, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Moonlight</h1>

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
                      onSelect={handleDateChange}
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
              <Select onValueChange={setCategory} defaultValue={category}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
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
          <div>
                <Label htmlFor="ledgerDate">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !ledgerDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {ledgerDate ? format(ledgerDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={ledgerDate}
                      onSelect={setLedgerDate}
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
                    <TableCell className={cn("text-right font-medium", entry.category === "Income" ? IncomeColor : ExpenseColor)}>
                      {entry.category === "Income" ? "+" : "-"}${entry.amount}
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



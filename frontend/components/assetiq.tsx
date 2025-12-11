"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function InstrumentComparisonUI() {
  const categories = ["Mutual Fund", "ETF", "Stocks"] as const;
  type Category = typeof categories[number];

  const instruments: Record<Category, string[]> = {
    "Mutual Fund": ["HDFC Equity Fund", "ICICI Bluechip Fund", "SBI Small Cap"],
    ETF: ["NIFTY50 ETF", "BankBees", "Gold ETF"],
    Stocks: ["Reliance", "Infosys", "TCS"]
  };

  const [category, setCategory] = useState<Category | "">("");
  const [instrumentA, setInstrumentA] = useState("");
  const [instrumentB, setInstrumentB] = useState("");
  const [comparison, setComparison] = useState<{ a: string; b: string; response: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCompare() {
    if (!instrumentA || !instrumentB) return;

    setLoading(true);
    try {
      const apiUrl = "http://assetiq-test-alb-88125757.ap-south-1.elb.amazonaws.com";
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: `session-${Date.now()}`,
          message: `Compare ${instrumentA} and ${instrumentB} on key metrics`,
        }),
      });

      const data = await response.json();
      setComparison({
        a: instrumentA,
        b: instrumentB,
        response: data.response
      });
    } catch (error) {
      console.error("Error calling chat API:", error);
      setComparison({
        a: instrumentA,
        b: instrumentB,
        response: "Error: Unable to fetch comparison data. Please ensure the backend server is running on http://assetiq-test-alb-88125757.ap-south-1.elb.amazonaws.com/"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex justify-center">
      <Card className="w-full max-w-4xl shadow-xl rounded-2xl">
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Panel */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Instrument Comparison</h2>

            {/* Category Dropdown */}
            <div>
              <p className="mb-2 text-gray-600">Category</p>
              <Select onValueChange={(value: string) => setCategory(value as Category)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instrument A */}
            <div>
              <p className="mb-2 text-gray-600">Instrument A</p>
              <Select onValueChange={setInstrumentA} disabled={!category}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Instrument A" />
                </SelectTrigger>
                <SelectContent>
                  {category && instruments[category].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instrument B */}
            <div>
              <p className="mb-2 text-gray-600">Instrument B</p>
              <Select onValueChange={setInstrumentB} disabled={!category}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Instrument B" />
                </SelectTrigger>
                <SelectContent>
                  {category && instruments[category].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleCompare} disabled={loading}>
              {loading ? "Comparing..." : "Compare"}
            </Button>
          </div>

          {/* Right Panel - Comparison Result */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white shadow-inner rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Comparison Result</h3>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="ml-3 text-gray-600">Analyzing instruments...</p>
              </div>
            )}
            {!comparison && !loading && (
              <p className="text-gray-500">Select two instruments to compare.</p>
            )}
            {comparison && !loading && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-xl">
                  <p className="font-medium">Instrument A:</p>
                  <p>{comparison.a}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-xl">
                  <p className="font-medium">Instrument B:</p>
                  <p>{comparison.b}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl mt-4 max-h-96 overflow-y-auto">
                  <p className="font-semibold mb-2">AI Analysis</p>
                  <div className="prose prose-sm max-w-none text-gray-700 text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {comparison.response}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
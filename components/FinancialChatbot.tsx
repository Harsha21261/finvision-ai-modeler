import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

interface FinancialChatbotProps {
  financialData: {
    revenue: number;
    expenses: number;
    cash: number;
    profitability: boolean;
    runway: string;
    ebitdaMargin: number;
    riskLevel: string;
  };
}

const FinancialChatbot: React.FC<FinancialChatbotProps> = ({ financialData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: 'Hi! I\'m your AI Financial Analyst. I can explain your financial report in detail. Ask me about your revenue, costs, profitability, or any financial metric!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('revenue') || message.includes('income')) {
      return `Your annual revenue is ${financialData.revenue.toLocaleString()}. This represents your total income before any expenses. ${financialData.profitability ? 'Your revenue exceeds your costs, making you profitable!' : 'You need to increase revenue or reduce costs to become profitable.'}`;
    }
    
    if (message.includes('cost') || message.includes('expense')) {
      return `Your monthly expenses are ${financialData.expenses.toLocaleString()}, totaling ${(financialData.expenses * 12).toLocaleString()} annually. This includes both COGS (direct costs) and OpEx (operational expenses). ${financialData.expenses * 12 < financialData.revenue ? 'Your costs are well-controlled relative to revenue.' : 'Consider optimizing costs to improve profitability.'}`;
    }
    
    if (message.includes('profit') || message.includes('margin')) {
      return `Your EBITDA margin is ${financialData.ebitdaMargin.toFixed(1)}%. ${financialData.ebitdaMargin > 15 ? 'This is a healthy margin showing good operational efficiency.' : 'This margin could be improved through cost optimization or revenue growth.'} ${financialData.profitability ? 'You are currently profitable!' : 'Focus on achieving positive margins.'}`;
    }
    
    if (message.includes('cash') || message.includes('runway')) {
      return `You have ${financialData.cash.toLocaleString()} in available cash with a runway of ${financialData.runway}. ${financialData.runway === 'Cash-flow positive' ? 'Excellent! You generate more cash than you spend.' : 'Monitor your cash carefully and consider funding options if needed.'}`;
    }
    
    if (message.includes('risk') || message.includes('investment')) {
      return `Your risk level is ${financialData.riskLevel}. ${financialData.riskLevel === 'Low' ? 'This indicates a stable financial position with adequate cash reserves.' : financialData.riskLevel === 'Medium' ? 'Moderate risk - monitor cash flow and consider growth strategies.' : 'High risk - immediate attention needed for cash management and funding.'}`;
    }
    
    if (message.includes('break') || message.includes('even')) {
      return `${financialData.profitability ? 'You have already achieved break-even! Focus on scaling and growth.' : 'You need to reach break-even by increasing revenue or reducing costs. Your current gap is the difference between revenue and total expenses.'}`;
    }
    
    if (message.includes('growth') || message.includes('scale')) {
      return `${financialData.profitability ? 'With positive cash flow, you can invest in growth initiatives like marketing, hiring, or product development.' : 'Focus on achieving profitability first, then consider growth investments.'} Monitor your unit economics and customer acquisition costs.`;
    }
    
    if (message.includes('valuation') || message.includes('worth')) {
      return `Your company valuation depends on multiple factors including revenue growth, profitability, market size, and industry multiples. ${financialData.profitability ? 'Profitable companies typically command higher valuations.' : 'Pre-revenue companies are valued on potential and market opportunity.'} Consider DCF and comparable company analysis.`;
    }
    
    // Default response
    return `I can help explain your financial metrics! Ask me about:
    • Revenue and income analysis
    • Cost breakdown and optimization  
    • Profitability and margins
    • Cash flow and runway
    • Risk assessment
    • Break-even analysis
    • Growth strategies
    • Company valuation
    
    What would you like to know more about?`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    const botResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      message: generateResponse(inputMessage),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 ${isOpen ? 'hidden' : 'flex'} items-center gap-2`}
      >
        <MessageCircle size={24} />
        <span className="hidden sm:block">Ask AI</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">AI Financial Analyst</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.type === 'bot' && <Bot size={16} className="mt-1 flex-shrink-0" />}
                    {msg.type === 'user' && <User size={16} className="mt-1 flex-shrink-0" />}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your financial report..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinancialChatbot;
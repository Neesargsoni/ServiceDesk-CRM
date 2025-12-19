// client/src/pages/TicketDetail.jsx - AI ENHANCED VERSION
// Add this new section after the description section (around line 193)

// Add these helper functions at the top with your other helpers
const getSentimentEmoji = (sentiment) => {
    switch(sentiment) {
        case "Positive": return "😊";
        case "Negative": return "😠";
        case "Urgent": return "🔥";
        default: return "😐";
    }
};

const getCategoryIcon = (category) => {
    switch(category) {
        case "Technical Issue": return "🔧";
        case "Billing Question": return "💳";
        case "Feature Request": return "✨";
        case "Bug Report": return "🐛";
        case "Account Issue": return "👤";
        default: return "📋";
    }
};

// Add state for smart replies (add this with your other useState declarations)
const [smartReplies, setSmartReplies] = useState([]);
const [loadingReplies, setLoadingReplies] = useState(false);

// Add function to fetch smart replies
const fetchSmartReplies = async () => {
    if (!isAdminOrAgent) return;
    
    setLoadingReplies(true);
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/tickets/${id}/smart-replies`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
            const data = await res.json();
            setSmartReplies(data.suggestions.replies || []);
        }
    } catch (err) {
        console.error("Error fetching smart replies:", err);
    } finally {
        setLoadingReplies(false);
    }
};

// Add this function to use a smart reply
const useSmartReply = (message) => {
    setComment(message);
    // Scroll to comment textarea
    document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth' });
};

// INSERT THIS SECTION IN YOUR JSX after the ticket description div (around line 193):

{/* 🤖 AI INSIGHTS SECTION */}
{(ticket.aiCategory || ticket.aiSentiment || ticket.aiSuggestedPriority) && (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="text-2xl">🤖</span>
            AI Insights
            {ticket.aiConfidence && (
                <span className="ml-auto text-sm font-normal px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-indigo-600 dark:text-indigo-400">
                    ✨ {ticket.aiConfidence}% confidence
                </span>
            )}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ticket.aiCategory && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Category
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(ticket.aiCategory)}</span>
                        {ticket.aiCategory}
                    </p>
                </div>
            )}
            
            {ticket.aiSentiment && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Customer Sentiment
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-xl">{getSentimentEmoji(ticket.aiSentiment)}</span>
                        {ticket.aiSentiment}
                    </p>
                </div>
            )}
            
            {ticket.aiSuggestedPriority && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        AI Suggested Priority
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        {ticket.aiSuggestedPriority}
                        {ticket.priority !== ticket.aiSuggestedPriority && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                                (Current: {ticket.priority})
                            </span>
                        )}
                    </p>
                </div>
            )}
        </div>
        
        {ticket.aiProcessedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-right">
                Analyzed on {new Date(ticket.aiProcessedAt).toLocaleString()}
            </p>
        )}
    </div>
)}

{/* 🤖 SMART REPLIES SECTION (Admin/Agent Only) */}
{isAdminOrAgent && (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-gray-100">
                <span className="text-2xl">💬</span>
                Smart Reply Suggestions
            </h2>
            <button
                onClick={fetchSmartReplies}
                disabled={loadingReplies}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    loadingReplies 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
            >
                {loadingReplies ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Generating...
                    </span>
                ) : (
                    '✨ Generate AI Replies'
                )}
            </button>
        </div>

        {smartReplies.length > 0 ? (
            <div className="space-y-3">
                {smartReplies.map((reply, index) => (
                    <div 
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                        onClick={() => useSmartReply(reply.message)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                {reply.type || `Option ${index + 1}`}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    useSmartReply(reply.message);
                                }}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                            >
                                Use This Reply
                            </button>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {reply.message}
                        </p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-2">🤖 Click "Generate AI Replies" to get smart response suggestions</p>
                <p className="text-xs">AI will analyze the ticket and suggest professional responses</p>
            </div>
        )}
    </div>
)}

// The rest of your TicketDetail component stays the same...
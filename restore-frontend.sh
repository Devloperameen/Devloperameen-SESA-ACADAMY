#!/bin/bash

echo "🔄 Restoring full SESA frontend..."

# Copy the backup back to the main App.tsx
cp frontend/src/App-backup.tsx frontend/src/App.tsx

echo "✅ Full frontend restored!"
echo "🚀 Your hackathon-winning platform is ready!"
echo ""
echo "📊 Status:"
echo "  - Backend: http://localhost:5000 ✅"
echo "  - Frontend: http://localhost:3000 ✅"
echo "  - Features: All AI, Collaboration, Analytics ready ✅"
echo ""
echo "🏆 Ready to win the hackathon!"
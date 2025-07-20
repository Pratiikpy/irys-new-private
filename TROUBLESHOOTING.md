# 🔧 Troubleshooting: Confessions Not Saving

If confessions are posting but not showing up after reloading the site, here are the most common causes and solutions:

## 🚨 Quick Fixes

### 1. Check Environment Variables
Run the environment check script:
```bash
python check_environment.py
```

Make sure all required variables are set in `backend/.env`:
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens
- `IRYS_PRIVATE_KEY` - Your Irys private key
- `CLAUDE_API_KEY` - Claude AI API key

### 2. Test the Backend
Run the test script to see what's happening:
```bash
node test_confession_debug.js
```

### 3. Check Backend Logs
If using Docker:
```bash
docker compose logs backend --tail=50
```

If running locally:
```bash
cd backend
python server.py
```

## 🔍 Common Issues

### Issue 1: Irys Upload Failing
**Symptoms**: Confession posts successfully but doesn't appear in feed
**Cause**: Irys blockchain upload is failing
**Solution**: The code now has fallback handling - confessions will save locally even if Irys fails

### Issue 2: Database Connection Issues
**Symptoms**: Backend errors or no confessions in database
**Cause**: MongoDB not running or wrong connection string
**Solution**: 
- Check if MongoDB is running
- Verify `MONGO_URL` in `.env`
- Try: `mongodb://localhost:27017` for local MongoDB

### Issue 3: AI Analysis Failing
**Symptoms**: Confession creation times out or fails
**Cause**: Claude API key missing or invalid
**Solution**: 
- Set `CLAUDE_API_KEY` in `.env`
- The code now has fallback handling for AI failures

### Issue 4: Moderation Filtering
**Symptoms**: Confessions saved but not displayed
**Cause**: Confessions being filtered out by moderation
**Solution**: The query filter has been simplified to show all public confessions

## 🛠️ Debug Steps

1. **Check if backend is running**:
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Check database state**:
   ```bash
   curl http://localhost:8000/api/debug/confessions
   ```

3. **Try posting a test confession**:
   ```bash
   curl -X POST http://localhost:8000/api/confessions \
     -H "Content-Type: application/json" \
     -d '{"content": "Test confession", "is_public": true}'
   ```

4. **Check if confessions are being fetched**:
   ```bash
   curl http://localhost:8000/api/confessions/public
   ```

## 🔧 Recent Fixes Applied

1. **Irys Fallback**: Confessions now save locally even if blockchain upload fails
2. **AI Analysis Fallback**: Confessions work even if Claude API fails
3. **Simplified Query**: Removed complex moderation filtering
4. **Better Error Handling**: Added detailed logging and error messages
5. **Database Logging**: Added confirmation when confessions are saved

## 📞 Still Having Issues?

1. Check the backend console for error messages
2. Verify all environment variables are set correctly
3. Make sure MongoDB is running and accessible
4. Try the test scripts to isolate the issue

The most likely cause is missing environment variables or database connection issues. The fixes above should resolve the most common problems. 
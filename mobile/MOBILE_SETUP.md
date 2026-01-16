# Mobile App - Local Network Testing Setup

This guide explains how to test the Yakkum mobile app on your physical device using the local network.

## Prerequisites

1. **Backend server running** on your development machine
2. **Mobile device and computer** connected to the same WiFi network
3. **Expo Go app** installed on your mobile device (or configured development build)

## Your Network Configuration

**Local IP Address:** `192.168.1.45`

This IP is already configured in the mobile app for development.

## Step-by-Step Setup

### 1. Start the Backend Server

```bash
cd backend
python manage.py runserver 0.0.0.0:8004
```

**Important:** Must use `0.0.0.0` to accept connections from other devices.

The backend API will be accessible at:
- `http://192.168.1.45:8004`

### 2. Verify Backend is Accessible

From your mobile device browser, try accessing:
- `http://192.168.1.45:8004/api/`

You should see the Django REST Framework API root.

### 3. Start the Mobile App

```bash
cd mobile
npm start
# or
npx expo start
```

This will start the Expo development server.

### 4. Connect from Your Device

**Option A: Scan QR Code**
1. Open Expo Go app on your device
2. Scan the QR code shown in terminal
3. App will load on your device

**Option B: Manual Entry**
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Enter the URL shown in terminal

### 5. Login to the App

Use your existing backend credentials:
- Email: Your registered email
- Password: Your password

The app will connect to `http://192.168.1.45:8004/api` automatically.

## API Configuration

The API endpoint is configured in:
- **File:** `mobile/services/api.ts`
- **Current Setting:** `http://192.168.1.45:8004/api` (development)

### Changing the API Endpoint

If your IP address changes, update line 8-11 in `mobile/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://YOUR_NEW_IP:8004/api'  // Update this line
  : 'https://your-production-url.com/api';
```

To find your current IP address:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig
```

## Troubleshooting

### Can't connect to API

1. **Check both devices are on same WiFi**
   - Mobile device and computer must be on same network
   - Corporate/Guest WiFi may block device-to-device communication

2. **Verify backend is running**
   ```bash
   # Should return API response
   curl http://192.168.1.45:8004/api/
   ```

3. **Check firewall settings**
   - macOS: System Settings → Network → Firewall → Allow incoming
   - Allow Python/Django through firewall

4. **Restart Expo**
   ```bash
   # Kill expo process
   killall -9 node

   # Start again
   npx expo start -c
   ```

### Network timeout errors

1. **Increase timeout in api.ts** (if needed)
2. **Check WiFi signal strength**
3. **Try restarting WiFi on both devices**

### 401 Authentication errors

1. **Clear app storage** in Expo Go settings
2. **Login again** with valid credentials
3. **Check backend logs** for authentication issues

### "Unable to resolve host" error

This means the device cannot reach the IP address.

**Solutions:**
1. Verify IP address is correct: `ipconfig getifaddr en0`
2. Ensure backend is running with `0.0.0.0:8000`
3. Check if devices are on same WiFi network
4. Disable VPN on development machine if active

## Testing Checklist

- [ ] Backend running on `0.0.0.0:8004`
- [ ] Can access `http://192.168.1.45:8004/api/` from mobile browser
- [ ] Mobile and computer on same WiFi
- [ ] Firewall allows incoming connections on port 8004
- [ ] Expo development server running
- [ ] App loaded successfully in Expo Go
- [ ] Can login with valid credentials
- [ ] API calls working (check survey list, etc.)

## Network Security

⚠️ **Development Only**

The current configuration is for **local development only**:
- Backend accepts all hosts (`ALLOWED_HOSTS = ['*']`)
- CORS allows all origins (`CORS_ALLOW_ALL_ORIGINS = True`)
- HTTP (not HTTPS) connections

**For production:**
1. Use HTTPS with valid SSL certificate
2. Configure specific `ALLOWED_HOSTS`
3. Set specific `CORS_ALLOWED_ORIGINS`
4. Use environment variables for URLs
5. Enable proper authentication/authorization

## Expo Configuration

The mobile app uses Expo for development. Key files:
- `app.json` - Expo app configuration
- `package.json` - Dependencies and scripts
- `babel.config.js` - Babel configuration

## Features Available for Testing

Once connected, you can test:
- ✅ User authentication (login/logout)
- ✅ Survey list viewing
- ✅ Survey detail viewing
- ✅ Location services (if enabled)
- ✅ Offline capabilities (if implemented)

## Development Tips

1. **Hot Reloading** - Changes auto-reload on device
2. **Shake Device** - Opens Expo developer menu
3. **Debug Menu** - Toggle remote debugging, performance monitor
4. **Logs** - Check Expo terminal for console logs

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Django CORS Configuration](https://github.com/adamchainz/django-cors-headers)

## Quick Commands Reference

```bash
# Get your IP address
ipconfig getifaddr en0

# Start backend for network access
cd backend && python manage.py runserver 0.0.0.0:8004

# Start mobile app
cd mobile && npm start

# Clear Expo cache and restart
cd mobile && npx expo start -c

# Check if port 8004 is accessible
curl http://192.168.1.45:8004/api/

# View Django logs
cd backend && python manage.py runserver 0.0.0.0:8004 --verbosity 2
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify network configuration
3. Check both backend and Expo logs
4. Ensure all dependencies are installed

# Runbook: SSL Certificate Issues

## Symptoms
- Browser shows certificate warning
- Alert: `KarmCertExpiringSoon` or `KarmCertExpired`
- Caddy logs show TLS errors

## Diagnosis
1. Check Caddy logs:
   ```bash
   docker compose logs caddy --tail=100
   ```

2. Check certificate status:
   ```bash
   # Check expiry
   echo | openssl s_client -connect ${CADDY_DOMAIN}:443 -servername ${CADDY_DOMAIN} 2>/dev/null | openssl x509 -noout -dates
   
   # Check certificate details
   echo | openssl s_client -connect ${CADDY_DOMAIN}:443 -servername ${CADDY_DOMAIN} 2>/dev/null | openssl x509 -noout -text | grep -A2 "Validity"
   ```

3. Check DNS:
   ```bash
   dig +short ${CADDY_DOMAIN}
   # Should point to server IP
   ```

4. Check Caddy config:
   ```bash
   cat /opt/karm-os/Caddyfile
   ```

## Common Issues

### Certificate Expired
```bash
# Force renewal
docker compose restart caddy
# Or remove certs and restart
docker compose down caddy
docker volume rm karm-os_caddy-data
docker compose up -d caddy
```

### DNS Not Propagated
```bash
# Check from multiple locations
dig @8.8.8.8 ${CADDY_DOMAIN}
dig @1.1.1.1 ${CADDY_DOMAIN}
# Wait for propagation (up to 48h for new domains)
```

### Rate Limited by Let's Encrypt
```bash
# Check Caddy logs for rate limit errors
# Wait 1 hour, or use staging endpoint for testing
# In Caddyfile, temporarily add:
# {
#   acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
# }
```

### Port 80/443 Blocked
```bash
# Check firewall
sudo ufw status
sudo iptables -L -n | grep -E '80|443'

# Check if ports are listening
ss -tlnp | grep -E '80|443'
```

### Certificate Not Covering Subdomain
```bash
# Check SANs in certificate
echo | openssl s_client -connect ${CADDY_DOMAIN}:443 -servername ${CADDY_DOMAIN} 2>/dev/null | openssl x509 -noout -ext subjectAltName
# Should include all needed subdomains
```

## Recovery
1. **Quick fix**: `docker compose restart caddy`
2. **Full reset**: Remove caddy-data volume and restart
3. **Manual cert**: Use `caddy cert` command if needed

## Prevention
- Monitor `KarmCertExpiringSoon` alert (30 days)
- Use DNS provider with API for DNS challenge (avoids port 80)
- Keep Caddy updated for latest ACME changes

## Post-Incident
- Verify all subdomains work
- Check HSTS header: `curl -I https://${CADDY_DOMAIN} | grep -i strict-transport-security`
- Update runbook if new failure mode
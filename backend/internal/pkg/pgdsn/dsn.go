package pgdsn

import (
	"fmt"
	"strings"
)

// StableDialParams is appended to every DSN.
// Do not add libpq keepalive keys (keepalives_count, etc.): lib/pq forwards
// unknown keywords as server GUCs and PostgreSQL rejects them.
const StableDialParams = "connect_timeout=15 options=-csearch_path=public"

// NormalizeSSLMode maps empty/"prefer" to disable because lib/pq does not
// implement prefer and fails with: unsupported sslmode "prefer".
func NormalizeSSLMode(sslmode string) string {
	switch strings.ToLower(strings.TrimSpace(sslmode)) {
	case "", "prefer":
		return "disable"
	default:
		return sslmode
	}
}

// Format builds a lib/pq keyword/value DSN.
func Format(host string, port int, user, password, dbname, sslmode string) string {
	sslmode = NormalizeSSLMode(sslmode)
	var base string
	if password == "" {
		base = fmt.Sprintf(
			"host=%s port=%d user=%s dbname=%s sslmode=%s",
			host, port, user, dbname, sslmode,
		)
	} else {
		base = fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			host, port, user, password, dbname, sslmode,
		)
	}
	return base + " " + StableDialParams
}

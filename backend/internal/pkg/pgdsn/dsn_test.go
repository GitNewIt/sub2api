package pgdsn

import (
	"strings"
	"testing"
)

func TestNormalizeSSLMode(t *testing.T) {
	if got := NormalizeSSLMode(""); got != "disable" {
		t.Fatalf("empty sslmode = %q", got)
	}
	if got := NormalizeSSLMode("prefer"); got != "disable" {
		t.Fatalf("prefer sslmode = %q", got)
	}
	if got := NormalizeSSLMode("require"); got != "require" {
		t.Fatalf("require sslmode = %q", got)
	}
}

func TestFormat(t *testing.T) {
	dsn := Format("127.0.0.1", 5432, "sub2", "secret", "sub2", "prefer")
	if !strings.Contains(dsn, "sslmode=disable") {
		t.Fatalf("expected disable, got %s", dsn)
	}
	if !strings.Contains(dsn, "password=secret") {
		t.Fatalf("missing password: %s", dsn)
	}
	if !strings.Contains(dsn, "connect_timeout=15") || !strings.Contains(dsn, "search_path=public") {
		t.Fatalf("missing dial params: %s", dsn)
	}
	if strings.Contains(dsn, "keepalive") {
		t.Fatalf("lib/pq must not send keepalive keywords: %s", dsn)
	}

	empty := Format("127.0.0.1", 5432, "sub2", "", "sub2", "disable")
	if strings.Contains(empty, "password=") {
		t.Fatalf("empty password should be omitted: %s", empty)
	}
}

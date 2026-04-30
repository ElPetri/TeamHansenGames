// =============================================================================
// content.js — Network Journey curriculum data
// Analogous to logic/levels.js — keep all educational content here.
// =============================================================================

// ---------------------------------------------------------------------------
// TOPOLOGY DEVICE DEFINITIONS
// Six devices shown in the SVG, referenced by id in packet steps.
// (Home Router combines Wireless AP + NAT router — standard in modern households.)
// ---------------------------------------------------------------------------
const DEVICES = [
    { id: 'client',   label: 'Client',        sublabel: '192.168.1.5',   emoji: '💻', x: 60,  y: 190 },
    { id: 'ap',       label: 'Home Router',   sublabel: 'NAT',           emoji: '📡', x: 220, y: 190 },
    { id: 'isp',      label: 'ISP Router',    sublabel: '',              emoji: '🌐', x: 380, y: 190 },
    { id: 'firewall', label: 'Firewall',       sublabel: '',              emoji: '🛡️', x: 540, y: 190 },
    { id: 'ids',      label: 'IDS / IPS',     sublabel: '',              emoji: '🔍', x: 700, y: 190 },
    { id: 'server',   label: 'Web Server',    sublabel: '203.0.113.5',   emoji: '🖥️', x: 860, y: 190 },
];

// Links between devices (drawn as lines in the SVG)
const LINKS = [
    { from: 'client',   to: 'ap'       },
    { from: 'ap',       to: 'isp'      },
    { from: 'isp',      to: 'firewall' },
    { from: 'firewall', to: 'ids'      },
    { from: 'ids',      to: 'server'   },
];

// Also define off-screen DNS resolver positions (used in DNS chapter)
const DNS_DEVICES = [
    { id: 'resolver',  label: 'Recursive Resolver', sublabel: '8.8.8.8',  emoji: '🔄', x: 380, y: 60  },
    { id: 'root-ns',   label: 'Root Name Server',   sublabel: '.',         emoji: '🌍', x: 540, y: 60  },
    { id: 'tld-ns',    label: 'TLD Name Server',    sublabel: '.us',       emoji: '🏷️', x: 700, y: 60  },
    { id: 'auth-ns',   label: 'Auth Name Server',   sublabel: 'teamhansen.us', emoji: '📋', x: 860, y: 60  },
];

// ---------------------------------------------------------------------------
// CHAPTER DEFINITIONS
// ---------------------------------------------------------------------------
const CHAPTERS = [

    // =========================================================================
    // OVERVIEW — Big Picture flyover
    // =========================================================================
    {
        id: 'overview',
        title: 'Big Picture',
        subtitle: 'The complete journey at a glance',
        packetColor: 'var(--pkt-overview)',
        showDnsModeToggle: false,
        hasQuiz: false,
        steps: [
            {
                id: 'ov-1',
                label: 'You type a URL',
                activeDevices: ['client'],
                packet: null,
                explanation: {
                    title: 'It starts with you',
                    body: 'You open a browser and type <strong>https://teamhansen.us</strong>. That single action kicks off a fascinating sequence of events involving dozens of systems across the internet — all completing in well under a second.',
                },
                inspector: null,
            },
            {
                id: 'ov-2',
                label: 'DNS: find the IP address',
                activeDevices: ['client', 'ap', 'isp'],
                packet: { from: 'client', to: 'isp', color: 'var(--pkt-dns)', label: 'DNS Query' },
                explanation: {
                    title: 'Chapter 1 preview — DNS',
                    body: 'Your computer doesn\'t know where <em>teamhansen.us</em> lives on the internet. It asks a Domain Name System (DNS) resolver to look it up, which returns an IP address like <code>203.0.113.5</code>. This is like calling 411 to get a phone number.',
                },
                inspector: null,
            },
            {
                id: 'ov-3',
                label: 'TCP: open a connection',
                activeDevices: ['client', 'ap', 'isp', 'firewall', 'ids', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-tcp)', label: 'SYN' },
                explanation: {
                    title: 'Chapter 2 preview — TCP Handshake',
                    body: 'Before any data is sent, the client and server perform a three-way handshake (SYN → SYN-ACK → ACK) to open a reliable, ordered connection. Every packet crosses all six network devices.'
                },
                inspector: null,
            },
            {
                id: 'ov-4',
                label: 'TLS: negotiate encryption',
                activeDevices: ['client', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-tls)', label: 'Client Hello' },
                explanation: {
                    title: 'Chapter 3 preview — TLS',
                    body: 'With the TCP connection open, the two sides agree on an encryption algorithm, exchange certificates, and derive a shared secret key — all without ever sending the key directly over the wire. After this, everything is encrypted.',
                },
                inspector: null,
            },
            {
                id: 'ov-5',
                label: 'HTTP: request & response',
                activeDevices: ['client', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-http)', label: 'GET /' },
                explanation: {
                    title: 'Chapter 4 preview — HTTP',
                    body: 'Inside the encrypted tunnel, your browser sends <code>GET / HTTP/1.1</code>. The server responds with <code>200 OK</code> and the HTML content of the page. The browser renders it and you see the website.',
                },
                inspector: null,
            },
            {
                id: 'ov-6',
                label: 'Page renders in your browser',
                activeDevices: ['client'],
                packet: { from: 'server', to: 'client', color: 'var(--pkt-http)', label: '200 OK' },
                explanation: {
                    title: 'Done — in milliseconds',
                    body: 'The HTML arrives, the browser parses it, fetches any linked CSS and JS, and renders the page. The entire journey — DNS, TCP, TLS, and HTTP — typically completes in 100–400 ms. Now let\'s go deep on each chapter.',
                },
                inspector: null,
            },
        ],
    },

    // =========================================================================
    // CHAPTER 1 — DNS Resolution
    // =========================================================================
    {
        id: 'dns',
        title: 'DNS Resolution',
        subtitle: 'Turning a name into an address',
        packetColor: 'var(--pkt-dns)',
        showDnsModeToggle: true,
        hasQuiz: true,
        deviceAnnotations: [
            { deviceId: 'ap', lines: ['LAN: 192.168.1.1', 'WAN: 203.0.113.42'], showFromStep: 2 },
        ],
        steps: [
            {
                id: 'dns-1',
                label: 'Browser checks DNS cache',
                activeDevices: ['client'],
                packet: null,
                explanation: {
                    title: 'Browser DNS cache',
                    body: 'Before making any network request, your browser checks its own internal DNS cache. If it recently looked up <em>teamhansen.us</em>, it might already know the IP address and can skip the entire lookup.',
                },
                advancedDetail: {
                    title: 'Cache Miss Scenario',
                    body: 'Each cached record has a Time-To-Live (TTL) set by the domain owner. Once expired, the browser must re-query. Common TTLs range from 60 seconds to 24 hours. A brand-new visitor with a cold cache will always trigger a full lookup.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/dns/dns-cache-poisoning/',
                },
                inspector: {
                    l2: { 'Note': '(local — no frames sent)' },
                    l3: { 'Note': 'local cache lookup — no packets' },
                    l4: { 'Protocol': '—' },
                    l7: { 'Action': 'Check browser DNS cache', 'Query': 'teamhansen.us (A record)', 'Result': '❌ Cache miss — TTL expired or first visit' },
                },
            },
            {
                id: 'dns-2',
                label: 'OS resolver checks hosts file & cache',
                activeDevices: ['client'],
                packet: null,
                explanation: {
                    title: 'OS local lookup',
                    body: 'The browser got a cache miss and asks the operating system to look up the address for teamhansen.us. The OS checks two local sources first: the <strong>hosts file</strong> (a static name-to-IP list on your device) and the <strong>OS-level DNS cache</strong>. Both are misses — no saved answer for teamhansen.us — so the OS must reach out to the Home Router.',
                },
                advancedDetail: {
                    title: 'The Hosts File',
                    body: 'The hosts file predates DNS — it was the original way computers mapped names to addresses. It is checked before any DNS query, making it useful for local development (<code>127.0.0.1 myapp.local</code>) or blocking domains. Malware sometimes modifies it to redirect legitimate sites.',
                    learnMoreUrl: 'https://en.wikipedia.org/wiki/Hosts_(file)',
                },
                inspector: {
                    l2: { 'Note': '(local — no frames sent)' },
                    l3: { 'Note': 'local lookup — no packets' },
                    l4: { 'Protocol': '—' },
                    l7: { 'Action': 'Check /etc/hosts + OS DNS cache', 'Hosts File': 'No entry for teamhansen.us', 'OS Cache': '❌ Miss — forwarding to network resolver', 'Resolver IP': '192.168.1.1 (Home Router, via DHCP)' },
                },
            },
            {
                id: 'dns-3',
                label: 'Query sent to Home Router (NAT)',
                activeDevices: ['client', 'ap'],
                packet: { from: 'client', to: 'ap', color: 'var(--pkt-dns)', label: 'DNS Query' },
                explanation: {
                    title: 'Query sent to Home Router',
                    body: 'The client sends a DNS query to the Home Router (<code>192.168.1.1</code>), which acts as a local DNS forwarder. The Home Router then performs <strong>NAT</strong>: it rewrites the source IP from the client\'s private address (192.168.1.5) to the Home Router\'s public WAN address (203.0.113.42). From the internet\'s perspective, the query originates from the Home Router, not the client.',
                },
                advancedDetail: {
                    title: 'UDP Port 53',
                    body: 'DNS queries use UDP by default because it is fast and lightweight. If the response is larger than 512 bytes (common with DNSSEC or many records), DNS falls back to TCP port 53. The resolver is configured on your device via DHCP or manually in network settings.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/dns/what-is-a-dns-server/',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33', 'Dst MAC': '00:1a:2b:3c:4d:5e (Home Router)' },
                    l3: { 'Src IP': '192.168.1.5', 'Dst IP': '192.168.1.1 (Home Router)' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '54312', 'Dst Port': '53' },
                    l7: { 'Type': 'DNS Query', 'Query': 'teamhansen.us', 'Record': 'A' },
                },
            },
            {
                id: 'dns-3b',
                label: 'Home Router forwards to ISP',
                activeDevices: ['ap', 'isp'],
                packet: { from: 'ap', to: 'isp', color: 'var(--pkt-dns)', label: 'DNS Query (NATed)' },
                explanation: {
                    title: 'Home Router forwards to ISP',
                    body: 'The <strong>Home Router</strong> sends the frame to its default gateway, the <strong>ISP</strong>, to try to resolve the DNS query. If the ISP Router can\'t resolve the DNS query, the ISP then routes the packet onward to the recursive resolver.',
                },
                advancedDetail: {
                    title: 'NAT and Port Tracking',
                    body: 'The router also tracks the source port in a NAT table so it can deliver the response back to the correct internal device. This is called NAPT (Network Address and Port Translation), or more commonly just NAT.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/network-layer/what-is-nat/',
                },
                inspector: {
                    l2: { 'Src MAC': '00:1a:2b:3c:4d:5e (Home Router WAN)', 'Dst MAC': '(ISP gateway)' },
                    l3: { 'Src IP': '203.0.113.42 (NATed)', 'Dst IP': '8.8.8.8' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '54312', 'Dst Port': '53' },
                    l7: { 'Type': 'DNS Query', 'Query': 'teamhansen.us', 'Record': 'A' },
                },
            },
            {
                id: 'dns-3c',
                label: 'ISP forwards to DNS Resolver',
                activeDevices: ['isp', 'resolver'],
                packet: { from: 'isp', to: 'resolver', color: 'var(--pkt-dns)', label: 'DNS Query' },
                explanation: {
                    title: 'ISP forwards to DNS Resolver',
                    body: 'The ISP routes the DNS query to a <strong>recursive resolver</strong> — a server dedicated to tracking down IP addresses on your behalf. The resolver will work through the DNS hierarchy to find the answer for teamhansen.us.',
                },
                advancedDetail: {
                    title: 'What is a Recursive Resolver?',
                    body: 'A recursive resolver (like Google\'s 8.8.8.8 or Cloudflare\'s 1.1.1.1) does the heavy lifting of the DNS lookup — querying Root, TLD, and Authoritative name servers in sequence until it gets a definitive answer. It also caches results to speed up future lookups.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/dns/what-is-a-dns-server/',
                },
                inspector: {
                    l2: { 'Src MAC': '(ISP gateway NIC)', 'Dst MAC': '(resolver NIC)' },
                    l3: { 'Src IP': '203.0.113.42 (NATed)', 'Dst IP': '8.8.8.8 (Recursive Resolver)' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '54312', 'Dst Port': '53' },
                    l7: { 'Type': 'DNS Query', 'Query': 'teamhansen.us', 'Record': 'A' },
                },
            },
            {
                id: 'dns-4',
                label: 'Resolver queries Root Name Server',
                activeDevices: ['isp'],
                packet: { from: 'isp', to: 'root-ns', color: 'var(--pkt-dns)', label: 'Root Query' },
                dnsOnly: true,
                explanation: {
                    title: 'Root Name Server',
                    body: 'The recursive resolver doesn\'t cache the answer, so it starts from the top. There are <strong>13 sets of root name servers</strong> (labeled A–M) distributed globally. The resolver asks a root server: <em>"Who handles .us domains?"</em>',
                },
                advancedDetail: {
                    title: 'Anycast Root Servers',
                    body: 'Despite 13 logical root server addresses, there are over 1,500 physical instances worldwide using Anycast routing — your query goes to the closest one. The root server responds with a referral to the TLD name server, not the final answer.',
                    learnMoreUrl: 'https://www.iana.org/domains/root/servers',
                },
                inspector: {
                    l2: { 'Src MAC': '(resolver NIC)', 'Dst MAC': '(gateway)' },
                    l3: { 'Src IP': '8.8.8.8', 'Dst IP': '198.41.0.4 (Root A)' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '45001', 'Dst Port': '53' },
                    l7: { 'Type': 'DNS Query', 'Query': 'teamhansen.us', 'Record': 'A' },
                },
            },
            {
                id: 'dns-5',
                label: 'Root refers to TLD Name Server',
                activeDevices: ['isp'],
                packet: { from: 'root-ns', to: 'isp', color: 'var(--pkt-dns)', label: 'Referral → .us NS' },
                dnsOnly: true,
                explanation: {
                    title: 'TLD referral',
                    body: 'The root server doesn\'t know the final answer — it returns a <strong>referral</strong>: <em>"I don\'t know, but here are the name servers for .us"</em>. The resolver now queries the .us TLD name server.',
                },
                advancedDetail: {
                    title: 'The DNS Hierarchy',
                    body: 'DNS is a distributed hierarchy: Root (.) → TLD (.us, .com, .org) → Second-level domain (teamhansen.us) → Subdomains (www.teamhansen.us). Each level only knows about the next level down, never the full path. This design makes DNS massively scalable.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/dns/glossary/dns-root-server/',
                },
                inspector: {
                    l2: { 'Src MAC': '(Root A NIC)', 'Dst MAC': '(gateway)' },
                    l3: { 'Src IP': '198.41.0.4', 'Dst IP': '8.8.8.8' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '53', 'Dst Port': '45001' },
                    l7: { 'Type': 'DNS Referral', 'Refers To': '.us TLD NS', 'NS Record': 'a.cctld.us' },
                },
            },
            {
                id: 'dns-6',
                label: 'Resolver queries TLD Name Server',
                activeDevices: ['isp'],
                packet: { from: 'isp', to: 'tld-ns', color: 'var(--pkt-dns)', label: '.us TLD Query' },
                dnsOnly: true,
                explanation: {
                    title: '.us TLD Name Server',
                    body: 'The recursive resolver now asks the .us TLD name server: <em>"Who is authoritative for teamhansen.us?"</em> The TLD server responds with another referral — the authoritative name server for the domain itself.',
                },
                advancedDetail: {
                    title: 'CNAME and Delegation',
                    body: 'The TLD server returns an NS (name server) record pointing to the domain\'s authoritative name server — often hosted by the registrar (e.g., Cloudflare, AWS Route 53, GoDaddy). This delegation is set when you register a domain.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/dns/dns-server-types/',
                },
                inspector: {
                    l2: { 'Src MAC': '(resolver NIC)', 'Dst MAC': '(gateway)' },
                    l3: { 'Src IP': '8.8.8.8', 'Dst IP': '216.131.1.4 (.us TLD)' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '45002', 'Dst Port': '53' },
                    l7: { 'Type': 'DNS Query', 'Query': 'teamhansen.us', 'Record': 'A' },
                },
            },
            {
                id: 'dns-7',
                label: 'Resolver queries Authoritative NS',
                activeDevices: ['isp'],
                packet: { from: 'isp', to: 'auth-ns', color: 'var(--pkt-dns)', label: 'Auth Query' },
                dnsOnly: true,
                explanation: {
                    title: 'Authoritative Name Server',
                    body: 'Finally the resolver reaches the <strong>authoritative name server</strong> for <em>teamhansen.us</em>. This server has the definitive answer. It returns an <strong>A record</strong>: the IPv4 address of the web server.',
                },
                advancedDetail: {
                    title: 'A Record vs AAAA vs CNAME',
                    body: '<strong>A record</strong>: maps a hostname to an IPv4 address (e.g., 203.0.113.5).<br><strong>AAAA record</strong>: maps to an IPv6 address (e.g., 2001:db8::1).<br><strong>CNAME record</strong>: an alias pointing to another hostname (e.g., teamhansen.us → pages.cloudflare.com). CNAMEs must eventually resolve to an A or AAAA.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/dns/dns-records/dns-a-record/',
                },
                inspector: {
                    l2: { 'Src MAC': '(resolver NIC)', 'Dst MAC': '(gateway)' },
                    l3: { 'Src IP': '8.8.8.8', 'Dst IP': '108.162.193.77 (Auth NS)' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '45003', 'Dst Port': '53' },
                    l7: { 'Type': 'DNS Query', 'Query': 'teamhansen.us', 'Record': 'A' },
                },
            },
            {
                id: 'dns-8',
                label: 'IP address returned to client',
                activeDevices: ['client', 'isp'],
                packet: { from: 'isp', to: 'client', color: 'var(--pkt-dns)', label: 'DNS Reply' },
                explanation: {
                    title: 'IP delivered & cached',
                    body: 'The authoritative server\'s answer travels back through the recursive resolver, which <strong>caches the result</strong> for future queries (for the duration of the TTL), then delivers the IP address to your computer. Your browser now knows the destination: <code>203.0.113.5</code>.',
                },
                advancedDetail: {
                    title: 'Negative Caching (NXDOMAIN)',
                    body: 'If the domain doesn\'t exist, the resolver receives an <strong>NXDOMAIN</strong> response and caches that too — meaning repeated lookups for a non-existent domain don\'t keep hammering name servers. The negative TTL is set in the zone\'s SOA record.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/dns/what-is-dns/',
                },
                inspector: {
                    l2: { 'Src MAC': '00:1a:2b:3c:4d:5e (Home Router)', 'Dst MAC': 'a4:5e:60:11:22:33' },
                    l3: { 'Src IP': '8.8.8.8', 'Dst IP': '192.168.1.5' },
                    l4: { 'Protocol': 'UDP', 'Src Port': '53', 'Dst Port': '54312' },
                    l7: { 'Type': 'DNS Reply', 'Answer': 'teamhansen.us → 203.0.113.5', 'TTL': '300s' },
                },
            },
        ],
        quiz: [
            {
                id: 'dns-q1',
                question: 'What does DNS stand for, and what is its primary purpose?',
                options: [
                    'Dynamic Network Service — assigns IP addresses to devices automatically',
                    'Domain Name System — translates human-readable hostnames into IP addresses',
                    'Distributed Naming Service — routes packets across the internet',
                    'Data Namespace Server — stores web page content close to users',
                ],
                correct: 1,
                explanation: 'DNS is the Domain Name System. Its core job is translating names like teamhansen.us into IP addresses like 203.0.113.5 so that packets can be routed correctly.',
            },
            {
                id: 'dns-q2',
                question: 'In the correct order, which servers does a recursive resolver query to resolve teamhansen.us?',
                options: [
                    'TLD server → Root server → Authoritative server',
                    'Authoritative server → TLD server → Root server',
                    'Root server → TLD server → Authoritative server',
                    'Root server → Authoritative server → TLD server',
                ],
                correct: 2,
                explanation: 'The resolver always starts at the top of the hierarchy: Root (.) → TLD (.us) → Authoritative (teamhansen.us). Each level refers the resolver one step further down.',
            },
            {
                id: 'dns-q3',
                question: 'What transport protocol does DNS typically use, and on which port?',
                options: [
                    'TCP, port 80',
                    'UDP, port 443',
                    'UDP, port 53',
                    'TCP, port 25',
                ],
                correct: 2,
                explanation: 'DNS uses UDP on port 53 for most queries because it is fast and connectionless. TCP port 53 is used when responses exceed 512 bytes (e.g., with DNSSEC or zone transfers).',
            },
            {
                id: 'dns-q4',
                question: 'Which device on the network diagram is responsible for forwarding the DNS query from your home to the internet?',
                options: [
                    'The Firewall',
                    'The IDS/IPS',
                    'The Home Router (NAT)',
                    'The Web Server',
                ],
                correct: 2,
                explanation: 'The Home Router (performing NAT) translates your private IP address (192.168.1.5) to the public IP before forwarding packets to the ISP — including your DNS queries.',
            },
            {
                id: 'dns-q5',
                question: 'What is a DNS TTL (Time-To-Live)?',
                options: [
                    'The maximum time a TCP connection can remain idle',
                    'How long a DNS record can be cached before it must be re-queried',
                    'The number of hops a DNS packet can traverse',
                    'The timeout before a DNS query is retried',
                ],
                correct: 1,
                explanation: 'TTL is set by the domain owner on each DNS record. It tells caches how many seconds they may keep the result before discarding it and querying again. Short TTLs (60s) enable fast propagation of changes; long TTLs (86400s = 24h) reduce DNS load.',
            },
        ],
    },

    // =========================================================================
    // CHAPTER 2 — TCP 3-Way Handshake
    // =========================================================================
    {
        id: 'tcp',
        title: 'TCP 3-Way Handshake',
        subtitle: 'Opening a reliable connection',
        packetColor: 'var(--pkt-tcp)',
        showDnsModeToggle: false,
        hasQuiz: true,
        // Show router IPs from Step 2 (index 1) onward so the NAT moment is clear
        deviceAnnotations: [
            { deviceId: 'ap', lines: ['LAN: 192.168.1.1', 'WAN: 203.0.113.42'], showFromStep: 1 },
        ],
        steps: [
            {
                id: 'tcp-1',
                label: 'Client sends SYN',
                activeDevices: ['client'],
                packet: null,
                explanation: {
                    title: 'Step 1 — SYN (Synchronize)',
                    body: 'With the IP address known, your browser opens a TCP connection to port 443 (HTTPS). It sends a <strong>SYN</strong> (synchronize) segment. This contains a randomly chosen <strong>Initial Sequence Number (ISN)</strong> — a starting counter for ordered delivery.',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33', 'Dst MAC': '00:1a:2b:3c:4d:5e' },
                    l3: { 'Src IP': '192.168.1.5', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'SYN', 'Seq': '1000 (ISN)', 'Ack': '0' },
                    l7: { 'Data': '(none — no application data yet)' },
                },
            },
            {
                id: 'tcp-2',
                label: 'SYN travels to Home Router (NAT)',
                activeDevices: ['client', 'ap'],
                packet: { from: 'client', to: 'ap', color: 'var(--pkt-tcp)', label: 'SYN' },
                natEvent: true,
                explanation: {
                    title: 'Step 2 — NAT at the Home Router',
                    body: 'The SYN packet reaches your Home Router — a single device that combines Wi-Fi and NAT routing (as most modern home routers do). It performs <strong>Network Address Translation (NAT)</strong>: replacing your private IP (<code>192.168.1.5</code>) with your public IP (<code>203.0.113.42</code>). Your private address is invisible to the public internet.',
                },
                inspector: {
                    l2: { 'Src MAC': 'f0:2f:74:aa:bb:cc (Home Router WAN)', 'Dst MAC': '(ISP next-hop)' },
                    l3: { 'Src IP': '203.0.113.42 ← was 192.168.1.5', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'SYN', 'Seq': '1000', 'Ack': '0' },
                    l7: { 'Data': '(none)' },
                },
                natLabel: '🔄 NAT: 192.168.1.5 → 203.0.113.42',
            },
            {
                id: 'tcp-3',
                label: 'SYN crosses ISP → Firewall → IDS → Server',
                activeDevices: ['isp', 'firewall', 'ids', 'server'],
                packet: { from: 'ap', to: 'server', color: 'var(--pkt-tcp)', label: 'SYN' },
                explanation: {
                    title: 'Step 3 — SYN traverses the internet',
                    body: 'The SYN packet travels through the ISP backbone, then hits the web server\'s <strong>firewall</strong>. The firewall checks: <em>is port 443 allowed inbound?</em> Yes. The packet then passes the <strong>IDS/IPS</strong> (intrusion detection/prevention) which inspects for known attack signatures. Clean, it reaches the web server.',
                },
                inspector: {
                    l2: { 'Src MAC': '(ISP last-mile)', 'Dst MAC': '(Server NIC)' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'SYN', 'Seq': '1000', 'Ack': '0' },
                    l7: { 'Data': '(none)' },
                },
            },
            {
                id: 'tcp-4',
                label: 'Server sends SYN-ACK',
                activeDevices: ['server'],
                packet: null,
                explanation: {
                    title: 'Step 4 — SYN-ACK',
                    body: 'The server\'s TCP stack receives the SYN and responds with <strong>SYN-ACK</strong>. It acknowledges the client\'s ISN (ACK = client ISN + 1) and sends its own randomly chosen ISN. Both sides are now announcing their starting sequence numbers.',
                },
                inspector: {
                    l2: { 'Src MAC': '(Server NIC)', 'Dst MAC': '(ISP next-hop)' },
                    l3: { 'Src IP': '203.0.113.5', 'Dst IP': '203.0.113.42' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '443', 'Dst Port': '52340', 'Flags': 'SYN+ACK', 'Seq': '5000 (server ISN)', 'Ack': '1001 (client ISN+1)' },
                    l7: { 'Data': '(none)' },
                },
            },
            {
                id: 'tcp-5',
                label: 'SYN-ACK travels back to client',
                activeDevices: ['server', 'ids', 'firewall', 'isp', 'ap', 'client'],
                packet: { from: 'server', to: 'client', color: 'var(--pkt-tcp)', label: 'SYN-ACK' },
                explanation: {
                    title: 'Step 5 — Return path',
                    body: 'The SYN-ACK travels the reverse path. The firewall allows it through because it tracks state (the outbound SYN created a connection table entry). The Home Router\'s NAT table translates the destination IP back to <code>192.168.1.5</code> before delivering to your computer.',
                },
                inspector: {
                    l2: { 'Src MAC': '00:1a:2b:3c:4d:5e (Home Router LAN)', 'Dst MAC': 'a4:5e:60:11:22:33' },
                    l3: { 'Src IP': '203.0.113.5', 'Dst IP': '192.168.1.5 ← NAT translated back' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '443', 'Dst Port': '52340', 'Flags': 'SYN+ACK', 'Seq': '5000', 'Ack': '1001' },
                    l7: { 'Data': '(none)' },
                },
            },
            {
                id: 'tcp-6',
                label: 'Client sends ACK — connection open',
                activeDevices: ['client', 'ap', 'isp', 'firewall', 'ids', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-tcp)', label: 'ACK' },
                explanation: {
                    title: 'Step 6 — ACK: connection established',
                    body: 'Your browser sends the final <strong>ACK</strong>, acknowledging the server\'s ISN (ACK = server ISN + 1). The three-way handshake is complete. Both sides have agreed on sequence numbers and a reliable, ordered byte stream is now open. The connection is <strong>ESTABLISHED</strong>.',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33', 'Dst MAC': '00:1a:2b:3c:4d:5e' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'ACK', 'Seq': '1001', 'Ack': '5001 (server ISN+1)' },
                    l7: { 'Data': '(none — TLS starts next)' },
                },
            },
        ],
        quiz: [
            {
                id: 'tcp-q1',
                question: 'What are the three segments exchanged in the TCP 3-way handshake, in order?',
                options: [
                    'SYN → ACK → FIN',
                    'SYN → SYN-ACK → ACK',
                    'SYN-ACK → SYN → ACK',
                    'ACK → SYN-ACK → SYN',
                ],
                correct: 1,
                explanation: 'The handshake is SYN (client initiates) → SYN-ACK (server acknowledges and replies) → ACK (client confirms). After these three segments, the connection is ESTABLISHED.',
            },
            {
                id: 'tcp-q2',
                question: 'What is Network Address Translation (NAT) doing at the home router?',
                options: [
                    'Encrypting packets before sending them to the internet',
                    'Replacing the private source IP with the public IP, and reversing this on return',
                    'Assigning IP addresses to devices on the local network',
                    'Blocking incoming connections from the internet',
                ],
                correct: 1,
                explanation: 'NAT replaces the private source IP (192.168.1.5) with the Home Router\'s public IP (203.0.113.42) on outbound packets, and reverses this for inbound packets using a connection table. This allows many devices to share one public IP.',
            },
            {
                id: 'tcp-q3',
                question: 'Why does the firewall allow the returning SYN-ACK packet through, even though it arrived unsolicited from the internet?',
                options: [
                    'Firewalls always allow TCP port 443 inbound',
                    'The IDS/IPS pre-approved it',
                    'The firewall is stateful — it remembers the outbound SYN and allows matching responses',
                    'The server\'s IP address is whitelisted',
                ],
                correct: 2,
                explanation: 'A stateful firewall tracks active connections. When the client\'s SYN left, the firewall created a state table entry. The returning SYN-ACK matches that entry and is allowed through. Packets that don\'t match any known connection are dropped.',
            },
            {
                id: 'tcp-q4',
                question: 'What is the purpose of the Initial Sequence Number (ISN) in TCP?',
                options: [
                    'To identify which application port is being used',
                    'To provide a random starting point for ordered, reliable byte-stream delivery',
                    'To authenticate the sender\'s identity',
                    'To set the maximum size of a TCP segment',
                ],
                correct: 1,
                explanation: 'The ISN is a randomly chosen starting sequence number. TCP uses sequence numbers to ensure data arrives in order and to detect missing or duplicate segments. Randomizing the ISN also prevents TCP sequence prediction attacks.',
            },
        ],
    },

    // =========================================================================
    // CHAPTER 3 — TLS Handshake
    // =========================================================================
    {
        id: 'tls',
        title: 'TLS Handshake',
        subtitle: 'Agreeing on a secret without meeting',
        packetColor: 'var(--pkt-tls)',
        showDnsModeToggle: false,
        hasQuiz: true,
        steps: [
            {
                id: 'tls-1',
                label: 'Client Hello',
                activeDevices: ['client'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-tls)', label: 'Client Hello' },
                explanation: {
                    title: 'Step 1 — Client Hello',
                    body: 'Inside the established TCP connection, the browser kicks off TLS. It sends a <strong>Client Hello</strong> listing: the TLS versions it supports, a list of <strong>cipher suites</strong> (algorithm combinations), and a random value (<em>client random</em>) used later to derive the session keys.',
                },
                simplification: {
                    note: 'The cipher suite negotiation is simplified here. In reality TLS 1.3 has fewer options and a more streamlined process than TLS 1.2.',
                    learnMoreUrl: 'https://tls13.xargs.org/',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33 (client)', 'Dst MAC': '00:1a:2b:3c:4d:5e (Home Router)' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'PSH+ACK' },
                    l7: { 'TLS': 'Client Hello', 'TLS Versions': 'TLS 1.2, TLS 1.3', 'Cipher Suites': 'TLS_AES_256_GCM_SHA384, …', 'Client Random': '3a7f…c219' },
                },
            },
            {
                id: 'tls-2',
                label: 'Server Hello + Certificate',
                activeDevices: ['server'],
                packet: { from: 'server', to: 'client', color: 'var(--pkt-tls)', label: 'Server Hello + Cert' },
                explanation: {
                    title: 'Step 2 — Server Hello & Certificate',
                    body: 'The server replies with a <strong>Server Hello</strong> (choosing the highest mutually supported TLS version and cipher suite, plus a <em>server random</em>) and its <strong>X.509 certificate</strong>. The certificate contains the server\'s public key and is signed by a Certificate Authority (CA) that your browser trusts.',
                },
                simplification: {
                    note: 'In TLS 1.3, the server also sends key share data in this same flight, making the handshake faster (1-RTT). We\'re showing a conceptual TLS 1.2-style flow for clarity.',
                    learnMoreUrl: 'https://tls13.xargs.org/',
                },
                inspector: {
                    l2: { 'Src MAC': '00:1a:2b:3c:4d:5e (Home Router LAN)', 'Dst MAC': 'a4:5e:60:11:22:33 (client)' },
                    l3: { 'Src IP': '203.0.113.5', 'Dst IP': '203.0.113.42' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '443', 'Dst Port': '52340', 'Flags': 'PSH+ACK' },
                    l7: { 'TLS': 'Server Hello', 'Chosen Cipher': 'TLS_AES_256_GCM_SHA384', 'Server Random': 'b4e2…9f01', 'Certificate': 'CN=teamhansen.us, Issuer: Let\'s Encrypt' },
                },
            },
            {
                id: 'tls-3',
                label: 'Browser verifies certificate',
                activeDevices: ['client'],
                packet: null,
                explanation: {
                    title: 'Step 3 — Certificate Verification',
                    body: 'The browser validates the server\'s certificate by checking: <ol style="margin-left:1.2rem;margin-top:0.5rem;line-height:1.8"><li>The domain name matches (<em>teamhansen.us</em>)</li><li>The certificate is not expired</li><li>The certificate is signed by a trusted Certificate Authority</li><li>The CA\'s signature chain leads to a Root CA in the browser\'s trust store</li></ol>',
                },
                simplification: {
                    note: 'Certificate verification involves walking a chain of trust: end-entity cert → intermediate CA → root CA. The browser ships with ~100+ trusted root CAs. Certificate Revocation Lists (CRLs) and OCSP are also checked.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/ssl/what-is-an-ssl-certificate/',
                },
                inspector: {
                    l2: { 'Note': '(local — no Ethernet frames sent)' },
                    l3: { 'Src IP': '(local)', 'Dst IP': '(local verification)' },
                    l4: { 'Protocol': '—', 'Note': 'local computation, no packets' },
                    l7: { 'Action': 'Verify cert chain', 'Subject': 'teamhansen.us', 'Issuer': "Let's Encrypt R3", 'Root CA': 'ISRG Root X1', 'Expires': '2026-07-12', 'Valid': '✓ YES' },
                },
            },
            {
                id: 'tls-4',
                label: 'Key exchange (ECDHE)',
                activeDevices: ['client', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-tls)', label: 'Key Exchange' },
                explanation: {
                    title: 'Step 4 — Key Exchange',
                    body: 'Using <strong>Elliptic Curve Diffie-Hellman Ephemeral (ECDHE)</strong>, both sides contribute a public value. Through mathematical operations on these values, both independently arrive at the same <strong>pre-master secret</strong> — without ever transmitting it. Combined with the client and server randoms, the session keys are derived.',
                },
                simplification: {
                    note: 'ECDHE is elegant: both sides start with their own private key and the other\'s public key. The math (elliptic curve scalar multiplication) produces the same result on both sides. An eavesdropper who sees both public values cannot compute the shared secret without solving the Elliptic Curve Discrete Logarithm Problem.',
                    learnMoreUrl: 'https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33 (client)', 'Dst MAC': '00:1a:2b:3c:4d:5e (Home Router)' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'PSH+ACK' },
                    l7: { 'TLS': 'Client Key Exchange', 'Method': 'ECDHE (P-256)', 'Client Public Key': 'ec3a…7f21 (public half only)', 'Pre-Master Secret': '(never transmitted — derived locally)' },
                },
            },
            {
                id: 'tls-5',
                label: 'Session keys derived',
                activeDevices: ['client', 'server'],
                packet: null,
                explanation: {
                    title: 'Step 5 — Deriving Session Keys',
                    body: 'Both client and server independently run the same <strong>key derivation function</strong> using: the pre-master secret + client random + server random. They arrive at the same set of symmetric keys — one for each direction. All further traffic is encrypted with <strong>AES-256-GCM</strong>.',
                },
                simplification: {
                    note: 'The full key derivation uses HKDF (HMAC-based Key Derivation Function). Multiple keys are produced: one for client→server encryption, one for server→client encryption, and authentication keys. In TLS 1.3, forward secrecy is mandatory — if the server\'s private key is later compromised, past sessions cannot be decrypted.',
                    learnMoreUrl: 'https://tls13.xargs.org/#server-handshake-keys-calc',
                },
                inspector: {
                    l2: { 'Note': '(local — no Ethernet frames sent)' },
                    l3: { 'Note': 'local computation on both sides' },
                    l4: { 'Protocol': '—' },
                    l7: { 'Action': 'Derive keys via HKDF', 'Input 1': 'Pre-master secret', 'Input 2': 'Client random + Server random', 'Output': 'Client write key, Server write key, IVs' },
                },
            },
            {
                id: 'tls-6',
                label: 'Finished — encrypted channel open',
                activeDevices: ['client', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-tls)', label: 'Finished (encrypted)' },
                explanation: {
                    title: 'Step 6 — Handshake Complete 🔒',
                    body: 'Both sides send a <strong>Finished</strong> message — the first encrypted payload — containing a hash of the entire handshake transcript. Each verifies the other\'s Finished message to confirm that the handshake was not tampered with in transit. The TLS tunnel is now established. The padlock appears in the browser.',
                },
                simplification: {
                    note: 'The Finished message provides implicit mutual authentication: if an attacker modified any handshake message, the hash would not match and the connection would be torn down. TLS does not require server-side session storage in TLS 1.3 — it can optionally send a session ticket for 0-RTT resumption.',
                    learnMoreUrl: 'https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33 (client)', 'Dst MAC': '00:1a:2b:3c:4d:5e (Home Router)' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'PSH+ACK' },
                    l7: { 'TLS': 'Finished (ENCRYPTED ✓)', 'MAC': 'handshake hash — verifies integrity', 'Status': '🔒 Encrypted session established' },
                },
            },
        ],
        quiz: [
            {
                id: 'tls-q1',
                question: 'What is the primary purpose of the server\'s X.509 certificate in TLS?',
                options: [
                    'To encrypt the application data',
                    'To prove the server\'s identity and provide its public key',
                    'To negotiate which TLS version to use',
                    'To store the session keys for reuse',
                ],
                correct: 1,
                explanation: 'The certificate proves identity: a trusted CA has signed the certificate, vouching that this public key belongs to teamhansen.us. The browser uses the public key during key exchange, but the certificate\'s primary role is authentication.',
            },
            {
                id: 'tls-q2',
                question: 'ECDHE key exchange is used instead of simply encrypting a key with the server\'s public key. Why?',
                options: [
                    'ECDHE is faster to compute than RSA encryption',
                    'ECDHE provides forward secrecy — past sessions can\'t be decrypted even if the server\'s private key is later stolen',
                    'ECDHE is required by the HTTP/1.1 standard',
                    'ECDHE avoids the need for certificates entirely',
                ],
                correct: 1,
                explanation: 'Forward secrecy (also called perfect forward secrecy) means each session uses an ephemeral key pair. Even if an attacker records encrypted traffic today and later obtains the server\'s private key, they cannot decrypt past sessions because the ephemeral keys are discarded after use.',
            },
            {
                id: 'tls-q3',
                question: 'A user visits a site and their browser shows a certificate warning. Which of the following is a valid reason?',
                options: [
                    'The page loaded over HTTPS instead of HTTP',
                    'The certificate was issued by a CA that is not in the browser\'s trust store',
                    'The server sent a SYN-ACK during the TCP handshake',
                    'The DNS TTL has expired',
                ],
                correct: 1,
                explanation: 'Browsers ship with a built-in list of trusted root CAs. If a certificate\'s chain of trust doesn\'t lead to one of those roots (e.g., it\'s self-signed, or issued by an untrusted private CA), the browser warns the user that the server\'s identity cannot be verified.',
            },
            {
                id: 'tls-q4',
                question: 'What does the TLS "Finished" message accomplish?',
                options: [
                    'It closes the TLS session and tears down the TCP connection',
                    'It sends the first HTTP request inside the encrypted tunnel',
                    'It verifies that the entire handshake transcript was not tampered with',
                    'It requests a new certificate from the server',
                ],
                correct: 2,
                explanation: 'The Finished message contains a hash (MAC) of all prior handshake messages. If any message was modified by a man-in-the-middle, the hash would not match and the connection fails. It\'s the integrity check that closes the loop on the handshake.',
            },
        ],
    },

    // =========================================================================
    // CHAPTER 4 — HTTP Request & Response
    // =========================================================================
    {
        id: 'http',
        title: 'HTTP Request & Response',
        subtitle: 'Asking for and receiving the page',
        packetColor: 'var(--pkt-http)',
        showDnsModeToggle: false,
        hasQuiz: true,
        steps: [
            {
                id: 'http-1',
                label: 'Browser sends GET request',
                activeDevices: ['client'],
                packet: null,
                explanation: {
                    title: 'Step 1 — HTTP GET Request',
                    body: 'With the encrypted TLS tunnel established, the browser sends an HTTP request. From this point on, the application data is <strong>encrypted</strong> — the intermediate devices (firewall, IDS) cannot read it. Inside the tunnel: <code>GET / HTTP/1.1<br>Host: teamhansen.us<br>Accept: text/html<br>User-Agent: Mozilla/5.0…</code>',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33 (client)', 'Dst MAC': '00:1a:2b:3c:4d:5e (Home Router)' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'PSH+ACK' },
                    l7: { 'TLS': '🔒 Encrypted', 'Plaintext (inside tunnel)': 'GET / HTTP/1.1', 'Host': 'teamhansen.us', 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': 'Mozilla/5.0 (…)' },
                },
            },
            {
                id: 'http-2',
                label: 'GET travels through all devices',
                activeDevices: ['client', 'ap', 'isp', 'firewall', 'ids', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-http)', label: 'GET / (encrypted)' },
                explanation: {
                    title: 'Step 2 — Stateful inspection at the firewall & IDS',
                    body: 'The encrypted packet crosses every device. The firewall performs <strong>stateful packet inspection</strong>: it recognizes this as part of an established connection (TCP state: ESTABLISHED) and allows it through. The IDS/IPS inspects the IP/TCP headers and connection metadata — it cannot read the encrypted payload, but checks for anomalous patterns.',
                },
                inspector: {
                    l2: { 'Src MAC': '(changes at each hop)', 'Dst MAC': '(next hop)' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'PSH+ACK', 'Seq': '1001', 'Ack': '5001' },
                    l7: { 'TLS': '🔒 Encrypted — payload not visible to intermediate devices' },
                },
            },
            {
                id: 'http-3',
                label: 'Web server processes the request',
                activeDevices: ['server'],
                packet: null,
                explanation: {
                    title: 'Step 3 — Server processes & responds',
                    body: 'The web server decrypts the request, reads the path (<code>/</code>) and Host header (<code>teamhansen.us</code>), and looks up the resource. It finds the root HTML file and prepares a response: <code>HTTP/1.1 200 OK</code>, with headers like <code>Content-Type: text/html</code> and <code>Content-Length</code>.',
                },
                inspector: {
                    l2: { 'Note': '(local — server processing, no frames sent yet)' },
                    l3: { 'Src IP': '203.0.113.5', 'Dst IP': '203.0.113.42' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '443', 'Dst Port': '52340', 'Flags': 'PSH+ACK' },
                    l7: { 'TLS': '🔒 Encrypted', 'Plaintext (response)': 'HTTP/1.1 200 OK', 'Content-Type': 'text/html; charset=UTF-8', 'Content-Length': '4821', 'Cache-Control': 'max-age=3600' },
                },
            },
            {
                id: 'http-4',
                label: '200 OK response travels back',
                activeDevices: ['server', 'ids', 'firewall', 'isp', 'ap', 'client'],
                packet: { from: 'server', to: 'client', color: 'var(--pkt-http)', label: '200 OK (encrypted)' },
                explanation: {
                    title: 'Step 4 — Response traverses back',
                    body: 'The HTTP response — encrypted inside TLS — travels the full return path. At the home router, NAT translates the destination IP back to <code>192.168.1.5</code>. The client decrypts and hands the HTML body to the browser\'s rendering engine.',
                },
                inspector: {
                    l2: { 'Src MAC': '00:1a:2b:3c:4d:5e (Home Router LAN)', 'Dst MAC': 'a4:5e:60:11:22:33' },
                    l3: { 'Src IP': '203.0.113.5', 'Dst IP': '192.168.1.5 ← NAT translated back' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '443', 'Dst Port': '52340', 'Flags': 'PSH+ACK' },
                    l7: { 'TLS': '🔒 Encrypted', 'Plaintext (after decrypt)': '<!DOCTYPE html><html>…' },
                },
            },
            {
                id: 'http-5',
                label: 'Browser renders the page',
                activeDevices: ['client'],
                packet: null,
                explanation: {
                    title: 'Step 5 — Render',
                    body: 'The browser parses the HTML, builds the DOM tree, then fetches linked resources (CSS, JS, images) — each triggering new HTTP requests over the same TLS connection. Once all resources are loaded and processed, the page is displayed. The journey is complete.',
                },
                inspector: {
                    l2: { 'Note': '(local — browser parsing, no frames sent)' },
                    l3: { 'Note': 'local processing — no network packets' },
                    l4: { 'Protocol': '—' },
                    l7: { 'Action': 'Parse HTML → build DOM', 'Sub-resources': 'style.css, script.js, images…', 'Status': '✅ Page rendered' },
                },
            },
            {
                id: 'http-6',
                label: 'TCP connection closes (FIN-ACK)',
                activeDevices: ['client', 'ap', 'isp', 'firewall', 'ids', 'server'],
                packet: { from: 'client', to: 'server', color: 'var(--pkt-tcp)', label: 'FIN' },
                explanation: {
                    title: 'Step 6 — TCP Teardown',
                    body: 'When done, the connection is gracefully closed using a <strong>FIN-ACK</strong> exchange (four-way). The client sends FIN → server ACKs → server sends FIN → client ACKs. Both ends move to the CLOSED state. The firewall removes the connection from its state table. NAT entry is released.',
                },
                inspector: {
                    l2: { 'Src MAC': 'a4:5e:60:11:22:33 (client)', 'Dst MAC': '00:1a:2b:3c:4d:5e (Home Router)' },
                    l3: { 'Src IP': '203.0.113.42', 'Dst IP': '203.0.113.5' },
                    l4: { 'Protocol': 'TCP', 'Src Port': '52340', 'Dst Port': '443', 'Flags': 'FIN+ACK', 'Note': '4-way teardown begins' },
                    l7: { 'HTTP': 'Connection: close', 'TLS': 'close_notify alert sent first' },
                },
            },
        ],
        quiz: [
            {
                id: 'http-q1',
                question: 'When the encrypted HTTP request reaches the firewall, what can the firewall inspect?',
                options: [
                    'The full HTTP headers and URL path',
                    'The HTML content of the response',
                    'The IP/TCP headers — the encrypted TLS payload is opaque',
                    'The TLS cipher suite and session keys',
                ],
                correct: 2,
                explanation: 'TLS encrypts the application-layer payload. The firewall can only see the IP and TCP headers (src/dst IP, ports, flags). It uses stateful inspection to verify the packet belongs to an established connection, but cannot read the HTTP content.',
            },
            {
                id: 'http-q2',
                question: 'What HTTP status code indicates the server successfully found and returned the requested resource?',
                options: [
                    '301 Moved Permanently',
                    '404 Not Found',
                    '500 Internal Server Error',
                    '200 OK',
                ],
                correct: 3,
                explanation: '200 OK means the request was successful and the response body contains the requested resource. 301 is a redirect, 404 means the resource doesn\'t exist, and 500 indicates a server-side error.',
            },
            {
                id: 'http-q3',
                question: 'Why does a browser typically need to make multiple HTTP requests after receiving the initial HTML response?',
                options: [
                    'To perform a new TLS handshake for each resource',
                    'Because the initial response only contains metadata, not the actual content',
                    'The HTML page references external resources (CSS, JS, images) that must each be fetched',
                    'HTTP requires all large files to be split across multiple GET requests',
                ],
                correct: 2,
                explanation: 'HTML is a document with references — <link> tags for CSS, <script> tags for JS, <img> tags for images, etc. Each referenced resource requires a separate HTTP request. Modern browsers pipeline and parallelize these requests over the existing TLS connection.',
            },
            {
                id: 'http-q4',
                question: 'What is the purpose of the TCP FIN-ACK sequence at the end of the HTTP exchange?',
                options: [
                    'It resets the TLS session keys for security',
                    'It gracefully closes the TCP connection, releasing both ends\' resources',
                    'It signals that the server is ready for the next HTTP request',
                    'It confirms that the HTML was rendered correctly in the browser',
                ],
                correct: 1,
                explanation: 'TCP FIN-ACK is the graceful connection teardown. The initiating side sends FIN (no more data from my side), the other side ACKs, then sends its own FIN, which is ACKed. Both sides release connection state, the firewall removes it from its table, and the NAT entry is freed.',
            },
        ],
    },
];

// ---------------------------------------------------------------------------
// FULL JOURNEY meta-chapter definition
// ---------------------------------------------------------------------------
const FULL_JOURNEY_CHAPTERS = ['overview', 'dns', 'tcp', 'tls', 'http'];

// ---------------------------------------------------------------------------
// ACRONYM DEFINITIONS
// Longer strings must come first so the regex prefers longer matches.
// ---------------------------------------------------------------------------
const ACRONYMS = {
    'NXDOMAIN': 'Non-Existent Domain (DNS error response when a name doesn\'t exist)',
    'DNSSEC':   'DNS Security Extensions (cryptographic signing of DNS records)',
    'ECDHE':    'Elliptic Curve Diffie-Hellman Ephemeral (key exchange algorithm)',
    'HTTPS':    'HTTP Secure — HTTP running inside a TLS encrypted tunnel',
    'FQDN':     'Fully Qualified Domain Name (e.g. www.teamhansen.us.)',
    'DHCP':     'Dynamic Host Configuration Protocol (auto-assigns IP addresses)',
    'OCSP':     'Online Certificate Status Protocol (real-time cert revocation check)',
    'CNAME':    'Canonical Name (DNS alias record pointing to another hostname)',
    'HKDF':     'HMAC-based Key Derivation Function (derives session keys from shared secret)',
    'HMAC':     'Hash-based Message Authentication Code (integrity verification)',
    'HTTP':     'Hypertext Transfer Protocol (application-layer web protocol)',
    'DNSSEC':   'DNS Security Extensions',
    'CRL':      'Certificate Revocation List (list of invalidated certificates)',
    'CDN':      'Content Delivery Network (distributed servers close to users)',
    'IDS':      'Intrusion Detection System (monitors traffic, raises alerts)',
    'IPS':      'Intrusion Prevention System (monitors and actively blocks threats)',
    'TLD':      'Top-Level Domain (the rightmost label in a domain, e.g. .us, .com)',
    'RTT':      'Round-Trip Time (time for a packet to go and come back)',
    'WAN':      'Wide Area Network (network spanning large geographic areas)',
    'LAN':      'Local Area Network (private network in a home or office)',
    'DOM':      'Document Object Model (browser\'s tree representation of a web page)',
    'PKI':      'Public Key Infrastructure (system of CAs, certs, and keys)',
    'AES':      'Advanced Encryption Standard (symmetric block cipher)',
    'GCM':      'Galois/Counter Mode (authenticated encryption mode used with AES)',
    'TLS':      'Transport Layer Security (cryptographic protocol for secure connections)',
    'DNS':      'Domain Name System (translates hostnames to IP addresses)',
    'TCP':      'Transmission Control Protocol (reliable, ordered transport layer)',
    'UDP':      'User Datagram Protocol (fast, connectionless transport layer)',
    'NAT':      'Network Address Translation (maps private IPs to a public IP)',
    'ISP':      'Internet Service Provider (company providing internet access)',
    'TTL':      'Time-To-Live (how long a DNS record or packet may be cached)',
    'ISN':      'Initial Sequence Number (random starting point for TCP ordering)',
    'ACK':      'Acknowledgment — TCP flag confirming receipt of data',
    'SYN':      'Synchronize — TCP flag that opens a connection',
    'FIN':      'Finish — TCP flag that gracefully closes a connection',
    'MAC':      'Media Access Control address (Layer 2 hardware identifier, e.g. aa:bb:cc:dd:ee:ff)',
    'SSL':      'Secure Sockets Layer (older predecessor to TLS, now deprecated)',
    'RSA':      'Rivest–Shamir–Adleman (public-key cryptography algorithm)',
    'SOA':      'Start of Authority (DNS record defining zone parameters)',
    'URL':      'Uniform Resource Locator (web address, e.g. https://teamhansen.us)',
    'GET':      'HTTP GET method — requests a resource from a server',
    'IP':       'Internet Protocol (Layer 3 addressing and routing)',
    'CA':       'Certificate Authority (trusted entity that signs TLS certificates)',
    'NS':       'Name Server (DNS record delegating a zone to specific servers)',
    'AP':       'Access Point (wireless device connecting clients to a wired network)',
};

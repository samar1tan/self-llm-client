#!/usr/bin/env python3
"""
GPU Monitor Server - Simple HTTP proxy for amdgpu_top

This server wraps amdgpu_top JSON output and exposes it via HTTP
for the vLLM chat client's GPU monitoring panel.

Usage:
    python3 gpu-monitor-server.py [--port PORT] [--host HOST]

Requirements:
    - amdgpu_top installed and in PATH
    - Python 3.8+

The server exposes:
    GET /gpu-stats  - Returns amdgpu_top JSON output
    GET /health     - Health check endpoint
"""

import argparse
import json
import subprocess
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

DEFAULT_HOST = '127.0.0.1'
DEFAULT_PORT = 5678

class GpuMonitorHandler(BaseHTTPRequestHandler):
    """HTTP request handler for GPU monitoring endpoints"""
    
    def log_message(self, format, *args):
        """Override to reduce log verbosity"""
        pass  # Suppress default logging
    
    def send_cors_headers(self):
        """Add CORS headers for browser access"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def send_json_response(self, data: dict, status: int = 200):
        """Send JSON response with proper headers"""
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(body)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        
        if path == '/health':
            self.handle_health()
        elif path == '/gpu-stats':
            self.handle_gpu_stats()
        else:
            self.send_json_response({'error': 'Not found'}, 404)
    
    def handle_health(self):
        """Health check endpoint"""
        self.send_json_response({'status': 'ok'})
    
    def handle_gpu_stats(self):
        """Fetch and return GPU stats from amdgpu_top"""
        try:
            # Run amdgpu_top with JSON output, single snapshot
            result = subprocess.run(
                ['amdgpu_top', '--json', '-n', '1'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode != 0:
                self.send_json_response({
                    'error': f'amdgpu_top failed: {result.stderr}'
                }, 500)
                return
            
            # Parse JSON output
            data = json.loads(result.stdout)
            self.send_json_response(data)
            
        except FileNotFoundError:
            self.send_json_response({
                'error': 'amdgpu_top not found. Install with: cargo install amdgpu_top'
            }, 500)
        except subprocess.TimeoutExpired:
            self.send_json_response({
                'error': 'amdgpu_top timeout'
            }, 500)
        except json.JSONDecodeError as e:
            self.send_json_response({
                'error': f'Invalid JSON from amdgpu_top: {str(e)}'
            }, 500)
        except Exception as e:
            self.send_json_response({
                'error': str(e)
            }, 500)


def check_amdgpu_top():
    """Check if amdgpu_top is available"""
    try:
        result = subprocess.run(
            ['amdgpu_top', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def main():
    parser = argparse.ArgumentParser(
        description='GPU Monitor Server - HTTP proxy for amdgpu_top'
    )
    parser.add_argument(
        '--host',
        default=DEFAULT_HOST,
        help=f'Host to bind to (default: {DEFAULT_HOST})'
    )
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=DEFAULT_PORT,
        help=f'Port to listen on (default: {DEFAULT_PORT})'
    )
    args = parser.parse_args()
    
    # Check for amdgpu_top
    if not check_amdgpu_top():
        print('WARNING: amdgpu_top not found or not working.')
        print('Install with: cargo install amdgpu_top')
        print('Or: sudo pacman -S amdgpu_top (Arch Linux)')
        print()
        print('Server will start but /gpu-stats will return errors.')
        print()
    
    # Start server
    server_address = (args.host, args.port)
    httpd = HTTPServer(server_address, GpuMonitorHandler)
    
    print(f'GPU Monitor Server starting on http://{args.host}:{args.port}')
    print()
    print('Endpoints:')
    print(f'  GET http://{args.host}:{args.port}/gpu-stats  - GPU metrics')
    print(f'  GET http://{args.host}:{args.port}/health     - Health check')
    print()
    print('Press Ctrl+C to stop')
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
        httpd.shutdown()


if __name__ == '__main__':
    main()

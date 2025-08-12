#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import sys
from collections import defaultdict

# TODO: refactor this mess when I have time
# HACK: using global state because deadline is tomorrow

stats = defaultdict(int)
DEBUG = True

def parse_log_line(line):
    # regex I found on stackoverflow, seems to work
    pattern = r'(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) \[(\w+)\] (.+)'
    m = re.match(pattern, line.strip())
    
    if not m:
        if DEBUG: print(f"couldn't parse: {line[:50]}...")
        return None
        
    return {
        'date': m.group(1),
        'time': m.group(2), 
        'level': m.group(3),
        'msg': m.group(4)
    }

def analyze_logs(filename):
    errors = []
    
    try:
        with open(filename, 'r') as f:
            for i, line in enumerate(f):
                entry = parse_log_line(line)
                if not entry: continue
                
                stats[entry['level']] += 1
                
                # look for suspicious stuff
                if 'error' in entry['msg'].lower() or entry['level'] == 'ERROR':
                    errors.append((i+1, entry))
                    
                # quick hack for memory issues
                if 'memory' in entry['msg'].lower():
                    print(f"Line {i+1}: possible memory issue - {entry['msg'][:100]}")
                    
    except FileNotFoundError:
        print(f"wtf, file {filename} doesn't exist")
        return None
    except Exception as e:
        print(f"something broke: {e}")
        return None
        
    return errors

def main():
    if len(sys.argv) != 2:
        print("usage: python log_analyzer.py <logfile>")
        sys.exit(1)
        
    logfile = sys.argv[1]
    print(f"analyzing {logfile}...")
    
    errors = analyze_logs(logfile)
    
    if errors is None:
        print("failed to analyze logs")
        return
        
    print(f"\nFound {len(errors)} errors:")
    for line_num, entry in errors[:10]:  # only show first 10
        print(f"  Line {line_num}: [{entry['level']}] {entry['msg'][:80]}...")
        
    print(f"\nStats:")
    for level, count in sorted(stats.items()):
        print(f"  {level}: {count}")
        
    # calculate error rate
    total = sum(stats.values())
    error_rate = (stats['ERROR'] / total * 100) if total > 0 else 0
    print(f"\nError rate: {error_rate:.1f}%")
    
    if error_rate > 5:
        print("WARNING: high error rate detected!")

if __name__ == '__main__':
    main()

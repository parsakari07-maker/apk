import { ANDROID_FILES } from '../data/sourceCode';

/**
 * Generates an automated Python 3 setup script that creates the complete Android Studio
 * folder structure and writes all Kotlin and XML source files directly onto the user's computer.
 */
export function generatePythonSetupScript(): string {
  const fileEntries: { path: string; content: string }[] = [];

  Object.values(ANDROID_FILES).forEach((file) => {
    fileEntries.push({
      path: file.path,
      content: file.code,
    });
  });

  const filesJson = JSON.stringify(fileEntries);

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NetMaster Suite - Automated Project Generator
Creates the entire Android Studio project directory structure and generates all Kotlin, XML,
and Gradle files automatically.

Usage:
    python setup_netmaster_project.py
"""

import os
import sys
import json

PROJECT_FILES = ${filesJson}

def create_project():
    print("=======================================================================")
    print("🚀 NetMaster Suite: Initializing Offline Android Project Setup")
    print("=======================================================================\\n")
    
    base_dir = os.path.abspath(os.getcwd())
    print(f"📁 Target Directory: {base_dir}\\n")
    
    created_count = 0
    
    for item in PROJECT_FILES:
        rel_path = item["path"]
        content = item["content"]
        
        full_path = os.path.join(base_dir, rel_path)
        dir_name = os.path.dirname(full_path)
        
        # Create directories if they do not exist
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
            print(f"📂 Created directory: {os.path.relpath(dir_name, base_dir)}")
            
        # Write the file
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        print(f"  ✅ Written: {rel_path} ({len(content.splitlines())} lines)")
        created_count += 1

    print("\\n=======================================================================")
    print(f"🎉 Successfully created {created_count} production-ready project files!")
    print("=======================================================================")
    print("\\nNext steps to run on Android Studio:")
    print("1. Open Android Studio.")
    print("2. Click 'Open' and select this root directory.")
    print("3. Allow Gradle to sync dependencies (Compose BOM 2024.06.00, CameraX 1.3.4, Ktor 2.3.11).")
    print("4. Connect your Android phone or use a hotspot and click 'Run' (Shift + F10).\\n")

if __name__ == "__main__":
    create_project()
`;
}

/**
 * Generates an automated Bash setup script for Linux / macOS.
 */
export function generateBashSetupScript(): string {
  let script = `#!/usr/bin/env bash
# =========================================================================
# NetMaster Suite - Automated Project Generator for Linux / macOS
# =========================================================================
set -e

echo "🚀 Setting up NetMaster Suite Android Project..."

`;

  Object.values(ANDROID_FILES).forEach((file) => {
    // Escape EOF marker in content if needed
    const safeContent = file.code.replace(/EOF_NETMASTER/g, 'EOF_NETMASTER_ESCAPED');
    script += `mkdir -p "$(dirname "${file.path}")"\n`;
    script += `cat << 'EOF_NETMASTER' > "${file.path}"\n`;
    script += safeContent + '\n';
    script += `EOF_NETMASTER\n`;
    script += `echo "  ✅ Created ${file.path}"\n\n`;
  });

  script += `echo "🎉 All NetMaster Suite project files created successfully!"\n`;
  script += `echo "Open this folder in Android Studio to build your APK."\n`;

  return script;
}

/**
 * Helper to download a text file with a specified filename and mime type.
 */
export function triggerFileDownload(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

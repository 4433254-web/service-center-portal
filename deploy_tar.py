import os, subprocess, tarfile, io

SERVER = "leto@192.168.31.166"
LOCAL_ROOT = r"C:\Projects\service-center-portal"
REMOTE_DIR = "/home/leto/service-center"
EXCLUDE_DIRS = {"node_modules", ".next", "dist", "uploads", "_unzip_mvp", "_unzip_mvp1", "_unzip_files2", ".git"}
EXCLUDE_FILES = {".env", ".env.local", ".env.server", "patch_ihattab.py", "service-center-mvp.zip", "service-center-mvp_1.zip", "files2.zip", "service-center-portal.rar"}

def should_include(path_parts):
    for part in path_parts:
        if part in EXCLUDE_DIRS:
            return False
    filename = path_parts[-1] if path_parts else ""
    if filename in EXCLUDE_FILES:
        return False
    if filename.endswith(".pdf") or filename.endswith(".rar") or filename.endswith(".zip"):
        return False
    return True

print("Building tarball...")
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    for root, dirs, files in os.walk(LOCAL_ROOT):
        # Filter excluded dirs in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for fname in files:
            full = os.path.join(root, fname)
            rel = os.path.relpath(full, LOCAL_ROOT).replace("\\", "/")
            parts = rel.split("/")
            if should_include(parts):
                tar.add(full, arcname=rel)

buf.seek(0)
data = buf.read()
print(f"Tarball size: {len(data)//1024} KB")

# Stream to server
cmd = f'ssh -o StrictHostKeyChecking=no {SERVER} "mkdir -p {REMOTE_DIR} && tar -xzf - -C {REMOTE_DIR}"'
proc = subprocess.run(cmd, input=data, shell=True, capture_output=True)
print("STDOUT:", proc.stdout.decode())
print("STDERR:", proc.stderr.decode()[:500] if proc.stderr else "")
print("Return code:", proc.returncode)
print("Done!")

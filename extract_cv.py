import zipfile
import xml.etree.ElementTree as ET
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(description='Extract paragraph text from a DOCX resume.')
parser.add_argument('document', type=Path, help='Path to the source DOCX document')
parser.add_argument('--output', type=Path, help='Optional output text file')
args = parser.parse_args()
path = args.document.resolve()
out_path = args.output.resolve() if args.output else path.with_suffix('.txt')

if path.suffix.lower() != '.docx':
    parser.error('The source document must be a DOCX file; PDF files are not supported.')

with zipfile.ZipFile(path) as z:
    xml_data = z.read('word/document.xml')

root = ET.fromstring(xml_data)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
out = []
for p in root.findall('.//w:p', ns):
    text = ''.join((t.text or '') for t in p.findall('.//w:t', ns)).strip()
    if text:
        out.append(text)

out_path.write_text('\n'.join(out), encoding='utf-8')
print('\n'.join(out[:250]))
print(f'\nExtracted text saved to {out_path}')

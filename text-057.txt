"""Brand only the freshly assembled Windows executable in this project's release."""
import ctypes
import struct
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
import pefile
target=Path(sys.argv[1]).resolve()
if target.parent.name!='win-unpacked' or target.parent.parent.parent!=(root/'release').resolve() or target.name!='BOOK STUDIO.exe':raise ValueError('Unexpected executable target')
icon=(root/'assets/BOOK-STUDIO.ico').read_bytes()
reserved,kind,count=struct.unpack_from('<HHH',icon)
if reserved or kind!=1:raise ValueError('Invalid application icon')
pe=pefile.PE(str(target));groups=[item.id for kind_item in pe.DIRECTORY_ENTRY_RESOURCE.entries if kind_item.id==14 for item in kind_item.directory.entries];pe.close()
kernel=ctypes.WinDLL('kernel32',use_last_error=True)
kernel.BeginUpdateResourceW.argtypes=[ctypes.c_wchar_p,ctypes.c_bool];kernel.BeginUpdateResourceW.restype=ctypes.c_void_p
kernel.UpdateResourceW.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_ushort,ctypes.c_void_p,ctypes.c_uint];kernel.UpdateResourceW.restype=ctypes.c_bool
kernel.EndUpdateResourceW.argtypes=[ctypes.c_void_p,ctypes.c_bool];kernel.EndUpdateResourceW.restype=ctypes.c_bool
handle=kernel.BeginUpdateResourceW(str(target),False)
if not handle:raise ctypes.WinError(ctypes.get_last_error())
def put(kind,identifier,raw):
    buffer=ctypes.create_string_buffer(raw)
    if not kernel.UpdateResourceW(handle,ctypes.c_void_p(kind),ctypes.c_void_p(identifier),1033,buffer,len(raw)):raise ctypes.WinError(ctypes.get_last_error())
try:
    group=bytearray(struct.pack('<HHH',0,1,count))
    for index in range(count):
        w,h,colors,unused,planes,bits,size,offset=struct.unpack_from('<BBBBHHII',icon,6+index*16)
        identifier=100+index;put(3,identifier,icon[offset:offset+size]);group+=struct.pack('<BBBBHHIH',w,h,colors,unused,planes,bits,size,identifier)
    for identifier in groups or [1]:put(14,identifier,bytes(group))
    if not kernel.EndUpdateResourceW(handle,False):raise ctypes.WinError(ctypes.get_last_error())
except Exception:
    kernel.EndUpdateResourceW(handle,True);raise
print('BOOK STUDIO application icon applied')

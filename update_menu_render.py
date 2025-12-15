import re

# Read the file
with open('src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the menu rendering section
old_menu_render = r'''                    {/* Menu */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {filteredMenuItems.map\(\(item\) => \(
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={\(\) => setIsOpen\(false\)}
                                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                \${isActive\(item.path\)
                                        \? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30'
                                        : 'text-white/70 hover:bg-white/15 hover:text-white hover:shadow-md hover:border hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-xl transition-transform duration-200 \${!isActive\(item.path\) && 'group-hover:scale-110'}`}>{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </div>

                            </Link>
                        \)\)}
                    </nav>'''

new_menu_render = '''                    {/* Menu */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {filteredMenuItems.map((item) => {
                            const itemIsActive = isActive(item.path) || (item.submenu && item.submenu.some(sub => isActive(sub.path)));
                            const isSubmenuOpen = openSubmenu === item.path;

                            return (
                                <div key={item.path}>
                                    {item.submenu ? (
                                        // Menu item with submenu
                                        <>
                                            <button
                                                onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.path)}
                                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                                                    ${itemIsActive
                                                        ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30'
                                                        : 'text-white/70 hover:bg-white/15 hover:text-white hover:shadow-md hover:border hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xl transition-transform duration-200 ${!itemIsActive && 'group-hover:scale-110'}`}>{item.icon}</span>
                                                    <span className="font-medium">{item.label}</span>
                                                </div>
                                                <svg
                                                    className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {isSubmenuOpen && (
                                                <div className="ml-8 mt-1 space-y-1">
                                                    {item.submenu.map((subItem) => (
                                                        <Link
                                                            key={subItem.path}
                                                            to={subItem.path}
                                                            onClick={() => setIsOpen(false)}
                                                            className={`block px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                                                                isActive(subItem.path)
                                                                    ? 'bg-white/20 text-white font-semibold'
                                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                                            }`}
                                                        >
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // Regular menu item
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                                                ${itemIsActive
                                                    ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30'
                                                    : 'text-white/70 hover:bg-white/15 hover:text-white hover:shadow-md hover:border hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl transition-transform duration-200 ${!itemIsActive && 'group-hover:scale-110'}`}>{item.icon}</span>
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>'''

content = re.sub(old_menu_render, new_menu_render, content, flags=re.DOTALL)

# Write back
with open('src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Menu rendering updated with submenu support")

import re

# Read the file
with open('src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add submenu to MenuItem interface
content = re.sub(
    r'(interface MenuItem \{[^}]+permission\?: keyof UserPermissions;)',
    r'\1\n    submenu?: Array<{ path: string; label: string }>;',
    content
)

# 2. Add openSubmenu state
content = re.sub(
    r'(const \[isOpen, setIsOpen\] = useState\(false\);)',
    r'\1\n    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);',
    content
)

# 3. Replace the three Resultados items with one submenu item
old_results = r'''        \{
            path: '/results/2024',
            label: 'Resultados 2024',
            icon: <FaChartArea />,
            permission: 'canViewStrategies'
        \},
        \{
            path: '/results/2023',
            label: 'Resultados 2023',
            icon: <FaChartArea />,
            permission: 'canViewStrategies'
        \},
        \{
            path: '/results/2022',
            label: 'Resultados 2022',
            icon: <FaChartArea />,
            permission: 'canViewStrategies'
        \},'''

new_results = '''        {
            path: '/results',
            label: 'Resultados',
            icon: <FaChartArea />,
            permission: 'canViewStrategies',
            submenu: [
                { path: '/results/2024', label: '2024' },
                { path: '/results/2023', label: '2023' },
                { path: '/results/2022', label: '2022' }
            ]
        },'''

content = re.sub(old_results, new_results, content, flags=re.DOTALL)

# Write back
with open('src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Sidebar updated successfully")

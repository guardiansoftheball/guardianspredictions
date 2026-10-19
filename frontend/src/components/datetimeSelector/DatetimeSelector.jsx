import React, { useEffect, useState } from 'react';

const formatNow = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const formattedMonth = month < 10 ? `0${month}` : `${month}`;
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${formattedMonth}-${formattedDay}T23:59`;
};

const DatetimeSelector = ({ value, onChange, id = 'datetime-selector', label = 'Select Date and Time:', variant }) => {
    const [internalValue, setInternalValue] = useState(() => value ?? formatNow());

    useEffect(() => {
        if (value === undefined || value === null || value === '') {
            setInternalValue((prev) => (prev ? prev : formatNow()));
        } else {
            setInternalValue(value);
        }
    }, [value]);

    const handleChange = (event) => {
        setInternalValue(event.target.value);
        if (onChange) {
            onChange(event);
        }
    };

    if (variant === 'dark') {
        return (
            <div>
                <label htmlFor={id} className="block mb-2 text-[13px] font-medium text-white/70">
                    {label}
                </label>
                <input
                    id={id}
                    type="datetime-local"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[15px] text-white focus:border-white/25 focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                    value={internalValue}
                    onChange={handleChange}
                />
            </div>
        );
    }

    return (
        <div className="p-4 bg-custom-gray-light text-white rounded-lg shadow-md max-w-md mx-auto my-4">
            <label htmlFor={id} className="block mb-2 font-bold">
                {label}
            </label>
            <input
                id={id}
                type="datetime-local"
                className="w-full p-2 rounded border-gray-300 shadow-sm bg-white text-black"
                value={internalValue}
                onChange={handleChange}
            />
        </div>
    );
};

export default DatetimeSelector;

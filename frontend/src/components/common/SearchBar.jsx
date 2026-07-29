import SearchIcon from "@mui/icons-material/Search";

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="input-group" style={{ maxWidth: 280 }}>
      <span className="input-group-text bg-white border-end-0">
        <SearchIcon fontSize="small" />
      </span>
      <input
        type="text"
        className="form-control border-start-0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
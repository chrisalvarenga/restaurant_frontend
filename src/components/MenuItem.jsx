export default function MenuItem({ item, onAdd }) {
  return (
    <div className={`menu-item ${!item.available ? 'unavailable' : ''}`}>
      <div className="menu-item-info">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <span className="price">${item.price.toFixed(2)}</span>
      </div>
      <button
        className="btn-add"
        onClick={() => onAdd(item)}
        disabled={!item.available}
      >
        {item.available ? '+ Agregar' : 'No disponible'}
      </button>
    </div>
  );
}
